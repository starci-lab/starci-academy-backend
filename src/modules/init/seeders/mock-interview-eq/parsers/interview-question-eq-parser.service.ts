import type {
    RawInterviewQuestionEq,
    RawInterviewQuestionEqBank,
} from "../types"
import {
    Injectable,
} from "@nestjs/common"
import {
    InterviewQuestionEntity,
} from "@modules/databases"
import {
    DeepPartial,
} from "typeorm"
import {
    InterviewQuestionEqIdFactoryService,
} from "../id-factories"
import {
    InterviewQuestionEqPathService,
} from "../path"
import {
    CoerceMdScalarService,
    ContextLoaderService,
    ExtractJsonFromMdService,
    InterviewQuestionFieldsService,
    logInitSeederEntitySkipped,
    ResolvedFilePath,
} from "../../shared"
import {
    WinstonService,
} from "@modules/winston"

/**
 * Parses behavioral (global, non-course-scoped) EQ mock-interview questions from
 * `mock-interview-eq/{bank}/questions/{question}/vi.md` (`vi.md` only — no `en.md` /
 * translations, same as the technical family).
 *
 * `courseId`/`moduleId` are ALWAYS `null` on every row — this family carries
 * universal EQ competencies, never grounded in a course/module.
 */
@Injectable()
export class InterviewQuestionEqParserService {
    constructor(
        private readonly interviewQuestionEqPathService: InterviewQuestionEqPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly interviewQuestionFieldsService: InterviewQuestionFieldsService,
        private readonly interviewQuestionEqIdFactoryService: InterviewQuestionEqIdFactoryService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Parses every behavioral mock-interview bank under `mock-interview-eq/` into a
     * flat list of question rows (there is no bank/deck entity — each question row
     * carries a denormalized `bankSlug` instead).
     *
     * @returns Flat, global (course/module-less) question entity partials for TypeORM upsert.
     */
    async parseMany(): Promise<Array<DeepPartial<InterviewQuestionEntity>>> {
        const bankPaths = await this.interviewQuestionEqPathService.bankPaths()
        const data: Array<DeepPartial<InterviewQuestionEntity>> = []
        for (const bankPath of bankPaths) {
            try {
                // parse one bank's questions; failures are isolated so siblings still seed
                const questions = await this.parseBank(bankPath)
                data.push(...questions)
            } catch (error) {
                // log + skip a malformed bank instead of aborting the seed
                logInitSeederEntitySkipped(
                    this.winstonService,
                    InterviewQuestionEntity,
                    bankPath.relativePath,
                    error,
                )
            }
        }
        return data
    }

    /**
     * Parses one behavioral mock-interview bank folder into its question rows.
     *
     * @param bankPath - The resolved bank folder path.
     * @returns Question entity partials for TypeORM upsert.
     */
    private async parseBank(
        bankPath: ResolvedFilePath,
    ): Promise<Array<DeepPartial<InterviewQuestionEntity>>> {
        // the bank META file lives at the bank folder root, sibling of `questions/`
        // (read for authoring context only — no `# moduleRefs` to resolve, this bank is global)
        this.extractJsonFromMdService.extract<RawInterviewQuestionEqBank>(
            await this.contextLoaderService.load(
                "mockInterviewEq",
                `${bankPath.relativePath}/vi.md`,
            ),
        )
        return this.parseQuestions(
            bankPath.relativePath,
            bankPath.orderIndex,
            // the bank folder's own slug, index stripped (already done by the path resolver)
            bankPath.displayId,
        )
    }

    /**
     * Parses the per-question folders under a bank's `questions/` directory.
     */
    private async parseQuestions(
        bankRelativePath: string,
        bankIndex: number,
        bankSlug: string,
    ): Promise<Array<DeepPartial<InterviewQuestionEntity>>> {
        const questionPaths = await this.interviewQuestionEqPathService.questionPaths(bankRelativePath)
        const questions: Array<DeepPartial<InterviewQuestionEntity>> = []
        for (const questionPath of questionPaths) {
            const raw = this.extractJsonFromMdService.extract<RawInterviewQuestionEq>(
                await this.contextLoaderService.load(
                    "mockInterviewEq",
                    `${questionPath.relativePath}/vi.md`,
                ),
            )
            // deterministic question id anchored on the bank/question ordinals only
            // (there is no owning course to anchor on — this bank is global)
            const questionId = this.interviewQuestionEqIdFactoryService.generate({
                bankIndex,
                questionIndex: questionPath.orderIndex,
            })
            const common = this.interviewQuestionFieldsService.parseCommonFields(
                raw,
                "behavioral",
                questionPath.orderIndex,
            )
            questions.push({
                id: questionId,
                ...common,
                // behavioral-only fields — never authored under the course-scoped technical tree
                competency: this.coerceMdScalarService.toNullableStringColumn(raw.competency),
                ownershipSignal: this.coerceMdScalarService.toNullableStringColumn(raw.ownershipSignal),
                // no diagram/givenCodes for behavioral — no code/diagram to reason over
                diagram: null,
                givenCodes: [],
                // global bank — never grounded in a course/module
                courseId: null,
                moduleId: null,
                bankSlug,
                displayId: questionPath.displayId,
            })
        }
        return questions
    }
}
