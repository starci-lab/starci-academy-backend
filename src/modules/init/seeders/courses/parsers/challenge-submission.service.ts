import {
    Injectable,
} from "@nestjs/common"
import {
    DeepPartial,
} from "typeorm"
import {
    ChallengeSubmissionEntity,
    ChallengeSubmissionPromptEntity,
    ChallengeSubmissionTranslationEntity,
    Locale,
    SubmissionType,
} from "@modules/databases"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
    ContextLoaderService,
    PathResolverService,
} from "../../shared"
import {
    ChallengeSubmissionIdFactoryService,
    ChallengeSubmissionPromptIdFactoryService,
} from "../id-factories"
import type {
    ChallengeEntity,
} from "@modules/databases"

/** Ordinals + paths for loading submissions from a challenge mount folder. */
export interface ParseChallengeSubmissionsParams {
    /** Challenge folder relative path under `courses/`. */
    challengeRelativePath: string
    /** Parent challenge id for FK relations. */
    challengeId: string
    courseIndex: number
    moduleIndex: number
    contentIndex: number
    challengeIndex: number
    /** Per-locale challenge extracts — used when `submissions/` folder is absent (legacy inline). */
    jsonMap: Map<Locale, Partial<ChallengeEntity>>
}

/**
 * Loads SCHEMA V2 challenge submissions from `submissions/<n>/{en,vi}.md` mount folders (numeric
 * index only, no slug). Falls back to `# submissions` in the main challenge markdown when the folder
 * is absent.
 */
@Injectable()
export class ChallengeSubmissionParserService {
    constructor(
        private readonly pathResolverService: PathResolverService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly challengeSubmissionIdFactoryService: ChallengeSubmissionIdFactoryService,
        private readonly challengeSubmissionPromptIdFactoryService: ChallengeSubmissionPromptIdFactoryService,
    ) { }

    /**
     * @param params - Challenge ordinals + locale extracts for legacy fallback.
     * @returns Submission entity partials ready for the V2 insert service.
     */
    async parseMany(
        params: ParseChallengeSubmissionsParams,
    ): Promise<Array<DeepPartial<ChallengeSubmissionEntity>>> {
        const submissionPaths = await this.pathResolverService.filePaths(
            "courses",
            `${params.challengeRelativePath}/submissions`,
        )
        if (submissionPaths.length) {
            const parsed: Array<DeepPartial<ChallengeSubmissionEntity>> = []
            for (const submissionPath of submissionPaths.sort(
                (left, right) => left.orderIndex - right.orderIndex,
            )) {
                parsed.push(await this.parseFolderSubmission(
                    params,
                    submissionPath.orderIndex,
                    submissionPath.relativePath,
                ))
            }
            return parsed
        }
        return this.parseInlineSubmissions(params)
    }

    /** Parses one submission from `submissions/<n>/{locale}.md`. */
    private async parseFolderSubmission(
        params: ParseChallengeSubmissionsParams,
        submissionOrderIndex: number,
        submissionRelativePath: string,
    ): Promise<DeepPartial<ChallengeSubmissionEntity>> {
        const jsonMap = new Map<Locale, Record<string, unknown>>()
        for (const locale of Object.values(Locale)) {
            try {
                const markdown = await this.contextLoaderService.load(
                    "courses",
                    `${submissionRelativePath}/${locale}.md`,
                )
                jsonMap.set(
                    locale,
                    this.extractJsonFromMdService.extract<Record<string, unknown>>(markdown),
                )
            } catch {
                // locale file optional — English drives scalar fields
            }
        }
        const en = jsonMap.get(Locale.En) ?? {
        }
        return this.buildSubmissionEntity(
            params,
            submissionOrderIndex,
            en,
            jsonMap,
        )
    }

    /** Legacy: `# submissions` blocks embedded in the main challenge `en.md` / `vi.md`. */
    private parseInlineSubmissions(
        params: ParseChallengeSubmissionsParams,
    ): Array<DeepPartial<ChallengeSubmissionEntity>> {
        const enSubmissions = (params.jsonMap.get(Locale.En)?.submissions ?? []) as unknown as Array<Record<string, unknown>>
        return enSubmissions.map((enSubmission) => {
            const submissionOrderIndex = typeof enSubmission.orderIndex === "number"
                ? enSubmission.orderIndex
                : 0
            return this.buildSubmissionEntity(
                params,
                submissionOrderIndex,
                enSubmission,
                params.jsonMap as Map<Locale, Record<string, unknown>>,
                enSubmission.prompts as Array<Record<string, unknown>> | undefined,
            )
        })
    }

    /** Maps extracted submission scalars (+ optional prompts) to a submission entity partial. */
    private buildSubmissionEntity(
        params: ParseChallengeSubmissionsParams,
        submissionOrderIndex: number,
        enSubmission: Record<string, unknown>,
        jsonMap: Map<Locale, Record<string, unknown>>,
        inlinePrompts?: Array<Record<string, unknown>>,
    ): DeepPartial<ChallengeSubmissionEntity> {
        const submissionId = this.challengeSubmissionIdFactoryService.generate({
            courseIndex: params.courseIndex,
            moduleIndex: params.moduleIndex,
            contentIndex: params.contentIndex,
            challengeIndex: params.challengeIndex,
            submissionIndex: submissionOrderIndex,
        })
        const title = typeof enSubmission.title === "string" ? enSubmission.title : ""
        const description = typeof enSubmission.description === "string"
            ? enSubmission.description
            : null
        const type = typeof enSubmission.type === "string" ? enSubmission.type : SubmissionType.GithubUrl
        const score = this.coerceMdScalarService.toRequiredNumber(enSubmission.score,
            0)
        const translations = Array.from(jsonMap.entries()).flatMap(
            ([
                locale,
                doc,
            ]) => {
                const value = locale === Locale.En
                    ? enSubmission
                    : (Array.isArray(doc?.submissions)
                        ? (doc.submissions as Array<Record<string, unknown>>).find(
                            (submission) => submission.orderIndex === submissionOrderIndex,
                        )
                        : doc)
                if (!value) {
                    return []
                }
                return [
                    {
                        challengeSubmissionId: submissionId,
                        locale,
                        value: typeof value.title === "string" ? value.title : title,
                        field: "title" as const,
                    },
                    {
                        challengeSubmissionId: submissionId,
                        locale,
                        value: typeof value.description === "string" ? value.description : (description ?? ""),
                        field: "description" as const,
                    },
                ] satisfies Array<DeepPartial<ChallengeSubmissionTranslationEntity>>
            },
        )
        const promptsSource = inlinePrompts
            ?? (Array.isArray(enSubmission.prompts) ? enSubmission.prompts : [])
        return {
            id: submissionId,
            orderIndex: submissionOrderIndex,
            title,
            description: this.coerceMdScalarService.toNullableStringColumn(description),
            type: type as SubmissionType,
            score,
            challenge: {
                id: params.challengeId,
            },
            translations,
            prompts: promptsSource.map<DeepPartial<ChallengeSubmissionPromptEntity>>(
                (prompt) => {
                    const promptOrderIndex = typeof prompt.orderIndex === "number" ? prompt.orderIndex : 0
                    const challengeSubmissionPromptId = this.challengeSubmissionPromptIdFactoryService.generate({
                        courseIndex: params.courseIndex,
                        moduleIndex: params.moduleIndex,
                        contentIndex: params.contentIndex,
                        challengeIndex: params.challengeIndex,
                        submissionIndex: submissionOrderIndex,
                        promptIndex: promptOrderIndex,
                    })
                    return {
                        id: challengeSubmissionPromptId,
                        orderIndex: promptOrderIndex,
                        title: typeof prompt.title === "string" ? prompt.title : "",
                        score: this.coerceMdScalarService.toRequiredNumber(prompt.score,
                            0),
                        promptText: typeof prompt.promptText === "string" ? prompt.promptText : "",
                        challengeSubmission: {
                            id: submissionId,
                        },
                        translations: [],
                    }
                },
            ),
        }
    }
}
