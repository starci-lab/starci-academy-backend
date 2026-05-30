import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    ChallengeSubmissionApproachCriteriaEntity,
    ChallengeSubmissionOutcomeCriteriaEntity,
} from "@modules/databases"
import {
    ContextLoaderService,
    ExtractJsonFromMdService,
} from "../../shared"
import {
    ChallengeSubmissionCriteriaIdFactoryService,
} from "../id-factories"
import {
    parseCriteriaMarkdown,
} from "./utils"
import type {
    ParseSubmissionCriteriaParams,
} from "./types"

/**
 * Parses the SCHEMA V2 per-submission grading rubric from inline `# approachCriterias` /
 * `# outcomeCriterias` sections in `submissions/<n>/en.md` (delimiter-wrapped criterion-first
 * markdown), with fallback to legacy separate files under `submissions/<n>/{approach,outcome}/`.
 *
 * Each file uses the criterion-first mount format (`# N` items with `## body` language buckets,
 * `## score`, and `## critical`) and is ENGLISH-ONLY — the rubric is never translated so the
 * grading prompt stays a single consistent reference. One entity row is emitted per programming
 * language; its `body` jsonb column carries that language's ordered criterion items.
 */
@Injectable()
export class ChallengeSubmissionCriteriaParserService {
    constructor(
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly challengeSubmissionCriteriaIdFactoryService: ChallengeSubmissionCriteriaIdFactoryService,
    ) { }

    /** Reads inline rubric markdown from a submission locale file extract, if present. */
    private async loadInlineCriteriaMarkdown(
        challengeRelativePath: string,
        submissionOrderIndex: number,
        kind: "approach" | "outcome",
    ): Promise<string | undefined> {
        let markdown: string
        try {
            markdown = await this.contextLoaderService.load(
                "courses",
                `${challengeRelativePath}/submissions/${submissionOrderIndex}/en.md`,
            )
        } catch {
            return undefined
        }
        const extracted = this.extractJsonFromMdService.extract<Record<string, unknown>>(markdown)
        const primaryKey = kind === "approach" ? "approachCriterias" : "outcomeCriterias"
        const value = extracted[primaryKey]
            ?? extracted[kind === "approach" ? "approachCriteria" : "outcomeCriteria"]
            ?? extracted[kind]
        if (typeof value !== "string" || !value.trim()) {
            return undefined
        }
        return value.trim()
    }

    /** Maps parsed criterion rows + total score for one rubric kind. */
    private buildCriteriaRows(
        params: ParseSubmissionCriteriaParams,
        kind: "approach" | "outcome",
        markdown: string,
    ): {
        rows: Array<DeepPartial<ChallengeSubmissionApproachCriteriaEntity>>
        totalScore: number
    } {
        const criteria = parseCriteriaMarkdown(markdown)
        const totalScore = criteria.reduce(
            (total, criterion) => total + criterion.score,
            0,
        )
        const {
            courseIndex,
            moduleIndex,
            contentIndex,
            challengeIndex,
            submissionOrderIndex,
            submissionId,
        } = params
        const rows = criteria.map((criterion) => {
            const id = this.challengeSubmissionCriteriaIdFactoryService.generate({
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
                submissionIndex: submissionOrderIndex,
                kind,
                criterionIndex: criterion.orderIndex,
            })
            return {
                id,
                orderIndex: criterion.orderIndex,
                critical: criterion.critical,
                challengeSubmission: {
                    id: submissionId,
                },
                langs: criterion.langs.map((langEntry, langIndex) => ({
                    id: this.challengeSubmissionCriteriaIdFactoryService.generateLang({
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        submissionIndex: submissionOrderIndex,
                        kind,
                        criterionIndex: criterion.orderIndex,
                        langIndex,
                    }),
                    lang: langEntry.lang,
                    body: langEntry.body,
                })),
            }
        })
        return {
            rows,
            totalScore,
        }
    }

    /**
     * Loads + parses one rubric (`# approachCriterias` / `# outcomeCriterias` inline, or legacy file).
     *
     * @param params - Submission ordinals + parent submission id.
     * @param kind - Rubric kind (`approach` or `outcome`).
     * @returns Per-language criteria entity partials + rubric weight total.
     */
    private async parseFile(
        params: ParseSubmissionCriteriaParams,
        kind: "approach" | "outcome",
    ): Promise<{
        rows: Array<DeepPartial<ChallengeSubmissionApproachCriteriaEntity>>
        totalScore: number
    }> {
        const {
            challengeRelativePath,
            submissionOrderIndex,
        } = params
        const inlineMarkdown = await this.loadInlineCriteriaMarkdown(
            challengeRelativePath,
            submissionOrderIndex,
            kind,
        )
        if (inlineMarkdown) {
            return this.buildCriteriaRows(params,
                kind,
                inlineMarkdown)
        }
        const nestedPath = `${challengeRelativePath}/submissions/${submissionOrderIndex}/${kind}/en.md`
        const flatPath = `${challengeRelativePath}/submissions/${submissionOrderIndex}/${kind}.md`
        let markdown: string
        try {
            markdown = await this.contextLoaderService.load(
                "courses",
                nestedPath,
            )
        } catch {
            try {
                markdown = await this.contextLoaderService.load(
                    "courses",
                    flatPath,
                )
            } catch {
                return {
                    rows: [],
                    totalScore: 0,
                }
            }
        }
        return this.buildCriteriaRows(params,
            kind,
            markdown)
    }

    /**
     * Parses both rubric files for a submission into the approach + outcome criteria entity rows and
     * recovers the rubric weight totals (used to set the submission's `approachScore`/`outcomeScore`/`score`).
     *
     * @param params - Submission ordinals + parent submission id.
     * @returns The submission's approach/outcome criteria entity partials + their weight totals.
     */
    async parse(
        params: ParseSubmissionCriteriaParams,
    ): Promise<{
        approachCriteria: Array<DeepPartial<ChallengeSubmissionApproachCriteriaEntity>>
        outcomeCriteria: Array<DeepPartial<ChallengeSubmissionOutcomeCriteriaEntity>>
        approachScore: number
        outcomeScore: number
    }> {
        // inline `# approachCriterias` / `# outcomeCriterias` in submissions/<n>/en.md, or legacy rubric files
        const approach = await this.parseFile(params,
            "approach")
        const outcome = await this.parseFile(params,
            "outcome")
        return {
            approachCriteria: approach.rows,
            outcomeCriteria: outcome.rows as Array<DeepPartial<ChallengeSubmissionOutcomeCriteriaEntity>>,
            approachScore: approach.totalScore,
            outcomeScore: outcome.totalScore,
        }
    }
}
