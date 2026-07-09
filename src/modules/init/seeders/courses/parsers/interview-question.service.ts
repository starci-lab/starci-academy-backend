import type {
    ParseInterviewQuestionBankManyParams,
    ParseInterviewQuestionBankParams,
    RawInterviewQuestion,
    RawInterviewQuestionBank,
    RawRef,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    InterviewQuestionEntity,
    InterviewQuestionGivenCodeEntity,
    ModuleEntity,
} from "@modules/databases"
import {
    DeepPartial,
    EntityManager,
} from "typeorm"
import {
    InterviewQuestionGivenCodeIdFactoryService,
    InterviewQuestionIdFactoryService,
} from "../id-factories"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    InterviewQuestionBankPathService,
} from "../path"
import {
    CoerceMdScalarService,
    ContextLoaderService,
    ExtractJsonFromMdService,
    InterviewQuestionFieldsService,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    InterviewQuestionBankPathNotFoundException,
} from "@modules/exceptions"
import {
    WinstonService,
} from "@modules/winston"

/**
 * Authored programming-language ordering for `# givenCodes` variants — mirrors the
 * FE's `DEFAULT_PROGRAMMING_LANGUAGES`, but re-declared here since no such constant is
 * importable BE-side. Any language outside this list falls back to object insertion
 * order (stable `Array.prototype.sort`).
 */
const DEFAULT_INTERVIEW_LANGUAGE_ORDER: ReadonlyArray<string> = [
    "typescript",
    "java",
    "csharp",
    "go",
]

/**
 * Parses course-scoped (technical) mock-interview questions from mounted course files
 * (`vi.md` only — this content has no `en.md` / translations) under
 * `courses/{course}/mock-interview/{bank}/questions/{question}/`.
 *
 * Follows the canonical mount-parse pattern (`.claude/pattern/16-mount-parsing.md`), but
 * skips the `MergeJsonService` locale-merge step entirely: {@link InterviewQuestionEntity}
 * is genuinely single-locale (`defaultLocale` is always `"vi"`, no translations table).
 */
@Injectable()
export class InterviewQuestionParserService {
    constructor(
        private readonly interviewQuestionBankPathService: InterviewQuestionBankPathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly interviewQuestionFieldsService: InterviewQuestionFieldsService,
        private readonly interviewQuestionIdFactoryService: InterviewQuestionIdFactoryService,
        private readonly interviewQuestionGivenCodeIdFactoryService: InterviewQuestionGivenCodeIdFactoryService,
        private readonly winstonService: WinstonService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Parses every mock-interview question bank under a course's `mock-interview/`
     * folder into a flat list of question rows (there is no bank/deck entity — each
     * question row carries a denormalized `bankSlug` instead).
     *
     * @param params - Course relative path + course ordinal/id.
     * @returns Flat, course-scoped question entity partials for TypeORM upsert.
     */
    async parseMany(
        {
            courseRelativePath,
            courseIndex,
            courseId,
        }: ParseInterviewQuestionBankManyParams,
    ): Promise<Array<DeepPartial<InterviewQuestionEntity>>> {
        // list every `{index}-{slug}` bank folder for this course
        const paths = await this.interviewQuestionBankPathService.paths(
            {
                courseRelativePath,
            },
        )
        const data: Array<DeepPartial<InterviewQuestionEntity>> = []
        for (const path of paths) {
            try {
                // parse one bank's questions; failures are isolated so siblings still seed
                const questions = await this.parseBank(
                    {
                        paths,
                        courseIndex,
                        courseId,
                        bankIndex: path.orderIndex,
                    },
                )
                data.push(...questions)
            } catch (error) {
                // log + skip a malformed bank instead of aborting the seed
                logInitSeederEntitySkipped(
                    this.winstonService,
                    InterviewQuestionEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        return data
    }

    /**
     * Parses one mock-interview question bank folder into its question rows.
     *
     * @param params - Bank-locating ordinals, owning course id, and resolved bank paths.
     * @returns Question entity partials for TypeORM upsert.
     */
    private async parseBank(
        {
            paths,
            courseIndex,
            courseId,
            bankIndex,
        }: ParseInterviewQuestionBankParams,
    ): Promise<Array<DeepPartial<InterviewQuestionEntity>>> {
        // locate the bank folder for the requested ordinal
        const path = paths.find(
            (path) => path.orderIndex === bankIndex,
        )
        // a missing folder is a hard error — caller logs + skips this bank
        if (!path) {
            throw new InterviewQuestionBankPathNotFoundException(
                {
                    interviewQuestionBankIndex: bankIndex,
                },
            )
        }
        // the bank META file lives at the bank folder root, sibling of `questions/`
        const raw = this.extractJsonFromMdService.extract<RawInterviewQuestionBank>(
            await this.contextLoaderService.load(
                "courses",
                `${path.relativePath}/vi.md`,
            ),
        )
        // `# moduleRefs` scopes every question in this bank to ONE module within the course
        const moduleIds = await this.resolveModuleRefIds(
            courseId,
            raw.moduleRefs,
        )
        return this.parseQuestions(
            {
                bankRelativePath: path.relativePath,
                courseIndex,
                courseId,
                bankIndex,
                // the bank folder's own slug, index stripped (already done by the path resolver)
                bankSlug: path.displayId,
                moduleId: moduleIds[0] ?? null,
            },
        )
    }

    /**
     * Parses the per-question folders under a bank's `questions/` directory.
     */
    private async parseQuestions(
        {
            bankRelativePath,
            courseIndex,
            courseId,
            bankIndex,
            bankSlug,
            moduleId,
        }: {
            bankRelativePath: string
            courseIndex: number
            courseId: string
            bankIndex: number
            bankSlug: string
            moduleId: string | null
        },
    ): Promise<Array<DeepPartial<InterviewQuestionEntity>>> {
        const questionPaths = await this.interviewQuestionBankPathService.questionPaths(bankRelativePath)
        const questions: Array<DeepPartial<InterviewQuestionEntity>> = []
        for (const questionPath of questionPaths) {
            const raw = this.extractJsonFromMdService.extract<RawInterviewQuestion>(
                await this.contextLoaderService.load(
                    "courses",
                    `${questionPath.relativePath}/vi.md`,
                ),
            )
            // deterministic question id anchored on the owning course + bank/question ordinals
            const questionId = this.interviewQuestionIdFactoryService.generate({
                courseIndex,
                bankIndex,
                questionIndex: questionPath.orderIndex,
            })
            const common = this.interviewQuestionFieldsService.parseCommonFields(
                raw,
                "technical",
                questionPath.orderIndex,
            )
            questions.push({
                id: questionId,
                ...common,
                // technical-only fields — never authored under the global behavioral tree
                diagram: this.coerceMdScalarService.toNullableStringColumn(raw.diagram),
                givenCodes: this.buildGivenCodes(raw.givenCodes,
                    questionId),
                courseId,
                moduleId,
                bankSlug,
                displayId: questionPath.displayId,
            })
        }
        return questions
    }

    /**
     * Strips a wrapping Markdown code fence (```lang\n…\n```) off an authored
     * `# givenCodes / ## <lang>` value — mirrors the read-path's
     * `StartMockInterviewSessionDrawService.stripCodeFence` so seeded rows already
     * match what the read-path expects (clean, unfenced).
     */
    private stripCodeFence(code: string): string {
        const trimmed = code.trim()
        const match = /^```[ \t]*\w*[ \t]*\r?\n([\s\S]*?)\r?\n```$/.exec(trimmed)
        return match ? match[1] : trimmed
    }

    /**
     * Builds the ordered given-code rows from the `# givenCodes` object
     * (`## typescript` / `## java` / `## csharp` / `## go`), ordered by
     * {@link DEFAULT_INTERVIEW_LANGUAGE_ORDER} (any other language falls back to
     * stable object-insertion order).
     */
    private buildGivenCodes(
        raw: Record<string, string> | undefined,
        interviewQuestionId: string,
    ): Array<DeepPartial<InterviewQuestionGivenCodeEntity>> {
        if (!raw) {
            return []
        }
        const ordered = Object.entries(raw).sort(([prevLang], [nextLang]) => {
            const prevRank = DEFAULT_INTERVIEW_LANGUAGE_ORDER.indexOf(prevLang)
            const nextRank = DEFAULT_INTERVIEW_LANGUAGE_ORDER.indexOf(nextLang)
            const prevOrder = prevRank === -1 ? DEFAULT_INTERVIEW_LANGUAGE_ORDER.length : prevRank
            const nextOrder = nextRank === -1 ? DEFAULT_INTERVIEW_LANGUAGE_ORDER.length : nextRank
            return prevOrder - nextOrder
        })
        return ordered.map(([lang,
            code], index) => ({
            id: this.interviewQuestionGivenCodeIdFactoryService.generate({
                interviewQuestionId,
                lang,
            }),
            lang,
            sortIndex: index,
            code: this.stripCodeFence(code),
            interviewQuestionId,
        }))
    }

    /**
     * Resolves `# moduleRefs` displayIds to module ids within the owning course.
     * Modules are already persisted by the time interview questions seed; unknown
     * displayIds are dropped (logged-skip semantics — a typo shouldn't abort the bank).
     *
     * @param courseId - Owning course id (scopes the lookup).
     * @param refs - Parsed `# moduleRefs` rows (each a module `displayId`).
     * @returns Deduped module ids (there is at most one — `moduleId` is a single column).
     */
    private async resolveModuleRefIds(
        courseId: string,
        refs: Array<RawRef> | undefined,
    ): Promise<Array<string>> {
        const displayIds = Array.from(
            new Set(
                (refs ?? [])
                    .map((ref) => (ref.value ?? "").trim())
                    .filter((value) => value.length > 0),
            ),
        )
        if (displayIds.length === 0) {
            return []
        }
        const ids: Array<string> = []
        for (const displayId of displayIds) {
            const module = await this.entityManager.findOne(ModuleEntity,
                {
                    where: {
                        displayId,
                        // `courseId` is a virtual @RelationId — not queryable in `where`;
                        // scope through the relation instead (mirrors FlashcardDeckParserService).
                        course: {
                            id: courseId,
                        },
                    },
                    select: {
                        id: true,
                    },
                })
            if (module) {
                ids.push(module.id)
            }
        }
        return ids
    }
}
