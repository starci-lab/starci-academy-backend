import type {
    ParseChallengeManyParams,
    ParseChallengeParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    ChallengeDifficulty,
    Locale,
    SubmissionType,
} from "../../../enums"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
} from "../extracts"
import {
    ChallengeIdFactoryService,
    ChallengeOutputIdFactoryService,
    ChallengePrerequisiteIdFactoryService,
    ChallengeSubmissionPromptIdFactoryService,
    ChallengeRequirementIdFactoryService,
    ChallengeStepIdFactoryService,
    ChallengeSubmissionIdFactoryService,
    ChallengeReferenceIdFactoryService,
    ContentIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    ChallengeEntity,
    ChallengeOutputTranslationEntity,
    ChallengePrerequisiteTranslationEntity,
    ChallengeReferenceTranslationEntity,
    ChallengeRequirementTranslationEntity,
    ChallengeStepTranslationEntity,
    ChallengeSubmissionPromptEntity,
    ChallengeSubmissionTranslationEntity,
    ChallengeTranslationEntity,
} from "../../../entities"
import {
    ChallengePathService,
    ResolvedFileResult,
} from "../path"
import {
    ContextLoaderService,
} from "../contexts"
import {
    ChallengePathNotFoundException,
} from "@modules/exceptions"

/**
 * Parses challenge from mounted course files (`en.md` / `vi.md`, optional `data.json`).
 */
@Injectable()
export class ChallengeParserService {
    constructor(
        private readonly challengePathService: ChallengePathService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly extractJsonFromMdService: ExtractJsonFromMdService,
        private readonly coerceMdScalarService: CoerceMdScalarService,
        private readonly challengeIdFactoryService: ChallengeIdFactoryService,
        private readonly challengeSubmissionPromptIdFactoryService: ChallengeSubmissionPromptIdFactoryService,
        private readonly challengeSubmissionIdFactoryService: ChallengeSubmissionIdFactoryService,
        private readonly challengeStepIdFactoryService: ChallengeStepIdFactoryService,
        private readonly challengeReferenceIdFactoryService: ChallengeReferenceIdFactoryService,
        private readonly challengeRequirementIdFactoryService: ChallengeRequirementIdFactoryService,
        private readonly challengeOutputIdFactoryService: ChallengeOutputIdFactoryService,
        private readonly challengePrerequisiteIdFactoryService: ChallengePrerequisiteIdFactoryService,
        private readonly contentIdFactoryService: ContentIdFactoryService,
    ) { }

    /**
     * Ánh xạ chuỗi `type` trong JSON challenge sang {@link SubmissionType} khớp enum Postgres `submission_type` (EN: maps markdown JSON `type` strings to DB-safe `SubmissionType` values).
     *
     * Template có thể dùng alias `githubRepository` / `github_repository` thay cho `githubUrl` (EN: templates may use `githubRepository` as a synonym for `githubUrl`).
     */
    private normalizeChallengeSubmissionType(raw: unknown): SubmissionType {
        if (raw === SubmissionType.GithubUrl || raw === SubmissionType.GoogleDocsUrl) {
            return raw
        }
        if (typeof raw !== "string") {
            return SubmissionType.GithubUrl
        }
        const normalized = raw.trim()
        if (
            normalized === ""
            || normalized === SubmissionType.GithubUrl
            || normalized === "github_repository"
            || normalized === "githubRepository"
        ) {
            return SubmissionType.GithubUrl
        }
        if (
            normalized === SubmissionType.GoogleDocsUrl
            || normalized === "google_docs_url"
        ) {
            return SubmissionType.GoogleDocsUrl
        }
        return SubmissionType.GithubUrl
    }

    private extractStructuredTextItems(
        value: unknown,
    ): Array<{ orderIndex: number; text: string }> {
        if (Array.isArray(value)) {
            return value
                .map((item, index) => {
                    if (typeof item === "string") {
                        return {
                            orderIndex: index,
                            text: item.trim(),
                        }
                    }
                    if (typeof item === "object" && item !== null) {
                        const record = item as Record<string, unknown>
                        const orderIndex = typeof record.orderIndex === "number"
                            ? record.orderIndex
                            : index
                        const text = [
                            record.text,
                            record.body,
                            record.value,
                            record.__content__,
                        ].find((entry) => typeof entry === "string" && entry.trim().length > 0)
                        return {
                            orderIndex,
                            text: typeof text === "string" ? text.trim() : "",
                        }
                    }
                    return {
                        orderIndex: index,
                        text: "",
                    }
                })
                .filter((item) => item.text.length > 0)
        }
        if (typeof value === "string" && value.trim().length > 0) {
            return [
                {
                    orderIndex: 0,
                    text: value.trim(),
                },
            ]
        }
        return []
    }

    private resolveItemTextByOrderIndex(
        value: unknown,
        orderIndex: number,
    ): string {
        const items = this.extractStructuredTextItems(value)
        return items.find((item) => item.orderIndex === orderIndex)?.text ?? ""
    }

    private getObjectStringByAliases(
        input: Record<string, unknown>,
        aliases: string[],
    ): string {
        for (const alias of aliases) {
            const value = input[alias]
            if (typeof value === "string" && value.trim().length > 0) {
                return value.trim()
            }
        }
        return ""
    }

    private extractRequirementItems(
        value: unknown,
    ): Array<{
        orderIndex: number
        purpose: string
        technicalConstraints: string
        proTipsHints: string
        forbidden: string
    }> {
        if (!Array.isArray(value)) {
            return []
        }
        return value
            .map((item, index) => {
                if (typeof item !== "object" || item === null) {
                    return null
                }
                const record = item as Record<string, unknown>
                const orderIndex = typeof record.orderIndex === "number"
                    ? record.orderIndex
                    : index
                const purpose = this.getObjectStringByAliases(
                    record,
                    [
                        "purpose",
                        "Purpose",
                        "mucTieu",
                        "Muc_tieu",
                        "Muc_tieu_(Goal)",
                    ],
                )
                const technicalConstraints = this.getObjectStringByAliases(
                    record,
                    [
                        "technicalConstraints",
                        "Technical_Constraints",
                        "Rang_buoc_ky_thuat",
                        "Rang_buoc",
                    ],
                )
                const proTipsHints = this.getObjectStringByAliases(
                    record,
                    [
                        "proTipsHints",
                        "Pro-tips/Hints",
                        "Goi_y_&_Meo",
                        "Goi_y",
                    ],
                )
                const forbidden = this.getObjectStringByAliases(
                    record,
                    [
                        "forbidden",
                        "Forbidden",
                        "Cam",
                        "Cấm",
                        "Prohibited",
                        "forbiddenRules",
                    ],
                )
                if (!purpose && !technicalConstraints && !proTipsHints && !forbidden) {
                    return null
                }
                return {
                    orderIndex,
                    purpose,
                    technicalConstraints,
                    proTipsHints,
                    forbidden,
                }
            })
            .filter((item): item is {
                orderIndex: number
                purpose: string
                technicalConstraints: string
                proTipsHints: string
                forbidden: string
            } => item !== null)
    }

    private resolveRequirementItemByOrderIndex(
        value: unknown,
        orderIndex: number,
    ): {
        purpose: string
        technicalConstraints: string
        proTipsHints: string
        forbidden: string
    } {
        const item = this.extractRequirementItems(value).find((entry) => entry.orderIndex === orderIndex)
        return item ?? {
            purpose: "",
            technicalConstraints: "",
            proTipsHints: "",
            forbidden: "",
        }
    }

    /**
     * Builds a partial challenge entity from mounted course files.
     */
    async parse(
        {
            paths,
            courseIndex,
            moduleIndex,
            contentIndex,
            challengeIndex,
        }: ParseChallengeParams,
    ): Promise<DeepPartial<ChallengeEntity>> {
        const path = paths.find(
            (path) => path.orderIndex === challengeIndex
        )
        if (!path) {
            throw new ChallengePathNotFoundException(
                {
                    challengeIndex,
                },
            )
        }
        const jsonMap = new Map<Locale, Partial<ChallengeEntity>>()
        for (const locale of Object.values(Locale)) {
            jsonMap.set(
                locale,
                this.extractJsonFromMdService.extract(
                    await this.contextLoaderService.load(
                        `${path.relativePath}/${locale}.md`,
                    ),
                ),
            )
        }
        const challengeId = this.challengeIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
                contentIndex,
                challengeIndex,
            },
        )
        return {
            id: challengeId,
            defaultLocale: Locale.En,
            displayId: path.displayId,
            contentId: this.contentIdFactoryService.generate(
                {
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                },
            ),
            title: jsonMap.get(Locale.En)?.title ?? "",
            description: jsonMap.get(Locale.En)?.description ?? "",
            difficulty: jsonMap.get(Locale.En)?.difficulty ?? ChallengeDifficulty.Easy,
            score: this.coerceMdScalarService.toRequiredNumber(
                jsonMap.get(Locale.En)?.score,
                0,
            ),
            orderIndex: challengeIndex,
            translations: (() => {
                const translations: Array<DeepPartial<ChallengeTranslationEntity>> = []
                for (const locale of Object.values(Locale)) {
                    translations.push({
                        challengeId,
                        locale,
                        field: "title",
                        value: jsonMap.get(locale)?.title ?? "",
                    })
                    translations.push({
                        challengeId,
                        locale,
                        field: "description",
                        value: jsonMap.get(locale)?.description ?? "",
                    })
                }
                return translations
            })(),
            challengeRequirements: (() => {
                const requirementItems = this.extractRequirementItems(
                    jsonMap.get(Locale.En)?.requirements,
                )
                return requirementItems.map((item) => {
                    const requirementId = this.challengeRequirementIdFactoryService.generate(
                        {
                            courseIndex,
                            moduleIndex,
                            contentIndex,
                            challengeIndex,
                            requirementIndex: item.orderIndex,
                        },
                    )
                    const translations = Array.from(jsonMap.entries()).map(
                        ([
                            locale,
                            challenge,
                        ]) => {
                            const localizedItem = this.resolveRequirementItemByOrderIndex(
                                challenge.requirements,
                                item.orderIndex,
                            )
                            return [
                                {
                                    challengeRequirementId: requirementId,
                                    locale,
                                    field: "purpose",
                                    value: localizedItem.purpose,
                                },
                                {
                                    challengeRequirementId: requirementId,
                                    locale,
                                    field: "technicalConstraints",
                                    value: localizedItem.technicalConstraints,
                                },
                                {
                                    challengeRequirementId: requirementId,
                                    locale,
                                    field: "proTipsHints",
                                    value: localizedItem.proTipsHints,
                                },
                                {
                                    challengeRequirementId: requirementId,
                                    locale,
                                    field: "forbidden",
                                    value: localizedItem.forbidden,
                                },
                            ] as Array<DeepPartial<ChallengeRequirementTranslationEntity>>
                        },
                    )
                        .flat()
                    return {
                        id: requirementId,
                        orderIndex: item.orderIndex,
                        purpose: item.purpose,
                        technicalConstraints: item.technicalConstraints,
                        proTipsHints: item.proTipsHints,
                        forbidden: item.forbidden,
                        defaultLocale: Locale.En,
                        challenge: {
                            id: challengeId,
                        },
                        translations,
                    }
                })
            })(),
            challengeOutputs: (() => {
                const outputItems = this.extractStructuredTextItems(
                    jsonMap.get(Locale.En)?.outputs ?? jsonMap.get(Locale.En)?.output,
                )
                return outputItems.map((item) => {
                    const outputId = this.challengeOutputIdFactoryService.generate(
                        {
                            courseIndex,
                            moduleIndex,
                            contentIndex,
                            challengeIndex,
                            outputIndex: item.orderIndex,
                        },
                    )
                    const translations = Array.from(jsonMap.entries()).map(
                        ([
                            locale,
                            challenge,
                        ]) => ({
                            challengeOutputId: outputId,
                            locale,
                            field: "text",
                            value: this.resolveItemTextByOrderIndex(
                                challenge.outputs ?? challenge.output,
                                item.orderIndex,
                            ),
                        } as DeepPartial<ChallengeOutputTranslationEntity>),
                    )
                    return {
                        id: outputId,
                        orderIndex: item.orderIndex,
                        text: item.text,
                        defaultLocale: Locale.En,
                        challenge: {
                            id: challengeId,
                        },
                        translations,
                    }
                })
            })(),
            challengePrerequisites: (() => {
                const prerequisiteItems = this.extractStructuredTextItems(
                    jsonMap.get(Locale.En)?.prerequisites,
                )
                return prerequisiteItems.map((item) => {
                    const prerequisiteId = this.challengePrerequisiteIdFactoryService.generate(
                        {
                            courseIndex,
                            moduleIndex,
                            contentIndex,
                            challengeIndex,
                            prerequisiteIndex: item.orderIndex,
                        },
                    )
                    const translations = Array.from(jsonMap.entries()).map(
                        ([
                            locale,
                            challenge,
                        ]) => ({
                            challengePrerequisiteId: prerequisiteId,
                            locale,
                            field: "text",
                            value: this.resolveItemTextByOrderIndex(
                                challenge.prerequisites,
                                item.orderIndex,
                            ),
                        } as DeepPartial<ChallengePrerequisiteTranslationEntity>),
                    )
                    return {
                        id: prerequisiteId,
                        orderIndex: item.orderIndex,
                        text: item.text,
                        defaultLocale: Locale.En,
                        challenge: {
                            id: challengeId,
                        },
                        translations,
                    }
                })
            })(),
            references: (jsonMap.get(Locale.En)?.references ?? [])
                .map(
                    ({
                        orderIndex,
                        alias,
                        url,
                    }) => {
                        const referenceId = this.challengeReferenceIdFactoryService.generate(
                            {
                                courseIndex,
                                moduleIndex,
                                contentIndex,
                                challengeIndex,
                                referenceIndex: orderIndex,
                            },
                        )
                        const translations = Array.from(jsonMap.entries())
                            .map(
                                (
                                    [
                                        locale,
                                        challenge,
                                    ]
                                ) => (challenge.references ?? [])
                                    .filter((reference) => reference.orderIndex === orderIndex)
                                    .map<DeepPartial<ChallengeReferenceTranslationEntity>>(
                                        (reference) => ({
                                            challengeReferenceId: referenceId,
                                            locale,
                                            field: "alias",
                                            value: reference.alias ?? "",
                                        }),
                                    ),
                            )
                            .flat()
                        return {
                            id: referenceId,
                            orderIndex,
                            alias,
                            url,
                            defaultLocale: Locale.En,
                            translations,
                            challenge: {
                                id: challengeId,
                            },
                        }
                    }
                ),
            steps: (
                jsonMap.get(Locale.En)?.steps ?? []).map(
                ({
                    orderIndex,
                    title,
                    body,
                }) => {
                    const stepId = this.challengeStepIdFactoryService.generate(
                        {
                            courseIndex,
                            moduleIndex,
                            contentIndex,
                            challengeIndex,
                            stepIndex: orderIndex,
                        },
                    )
                    const translations = Array.from(jsonMap.entries())
                        .map(
                            (
                                [
                                    locale,
                                    challenge,
                                ]
                            ) => (challenge.steps ?? [])
                                .filter((step) => step.orderIndex === orderIndex)
                                .map<Array<DeepPartial<ChallengeStepTranslationEntity>>>((step) => {
                                    return [
                                        {
                                            challengeStepId: stepId,
                                            locale,
                                            value: step.title,
                                            field: "title",
                                        },
                                        {
                                            challengeStepId: stepId,
                                            locale,
                                            value: step.body,
                                            field: "body",
                                        },
                                    ]
                                }),
                        )
                        .flat()
                        .flat()
                    return {
                        id: stepId,
                        orderIndex,
                        title,
                        defaultLocale: Locale.En,
                        challenge: {
                            id: challengeId,
                        },
                        body,
                        translations,
                    }
                }
            ),
            submissions: (
                jsonMap.get(Locale.En)?.submissions ?? []
            ).map(
                ({
                    orderIndex: submissionOrderIndex,
                    title,
                    description,
                    type,
                    score,
                    prompts,
                }) => {
                    const submissionId = this.challengeSubmissionIdFactoryService.generate(
                        {
                            courseIndex,
                            moduleIndex,
                            contentIndex,
                            challengeIndex,
                            submissionIndex: submissionOrderIndex,
                        },
                    )
                    const translations = Array.from(jsonMap.entries())
                        .map(
                            (
                                [
                                    locale,
                                    challenge,
                                ]
                            ) => (challenge.submissions ?? [])
                                .filter((submission) => submission.orderIndex === submissionOrderIndex)
                                .map<Array<DeepPartial<ChallengeSubmissionTranslationEntity>>>(
                                    (submission) => {
                                        return [
                                            {
                                                challengeSubmissionId: submissionId,
                                                locale,
                                                value: submission.title ?? "",
                                                field: "title",
                                            },
                                            {
                                                challengeSubmissionId: submissionId,
                                                locale,
                                                value: submission.description ?? "",
                                                field: "description",
                                            },
                                        ]
                                    },
                                ),
                        )
                        .flat()
                        .flat()
                    const promptList = prompts ?? []
                    return {
                        id: submissionId,
                        orderIndex: submissionOrderIndex,
                        title,
                        description: this.coerceMdScalarService.toNullableStringColumn(
                            description,
                        ),
                        type: this.normalizeChallengeSubmissionType(
                            type ?? SubmissionType.GithubUrl,
                        ),
                        score: this.coerceMdScalarService.toRequiredNumber(
                            score,
                            0,
                        ),
                        defaultLocale: Locale.En,
                        challenge: {
                            id: challengeId,
                        },
                        translations,
                        prompts: promptList.map<DeepPartial<ChallengeSubmissionPromptEntity>>(
                            (
                                {
                                    orderIndex,
                                    title,
                                    score,
                                    promptText,
                                }
                            ) => {
                                const challengeSubmissionPromptId = this.challengeSubmissionPromptIdFactoryService.generate(
                                    {
                                        courseIndex,
                                        moduleIndex,
                                        contentIndex,
                                        challengeIndex,
                                        submissionIndex: submissionOrderIndex,
                                        promptIndex: orderIndex,
                                    },
                                )
                                const translations = Array.from(jsonMap.entries())
                                    .map(
                                        (
                                            [
                                                locale,
                                                challenge,
                                            ]
                                        ) => {
                                            const submission = (challenge.submissions ?? []).find(
                                                (submission) => submission.orderIndex === submissionOrderIndex,
                                            )
                                            const prompt = (submission?.prompts ?? []).find(
                                                (prompt) => prompt.orderIndex === orderIndex,
                                            )
                                            if (!prompt) {
                                                return []
                                            }
                                            return [
                                                {
                                                    challengeSubmissionPromptId,
                                                    locale,
                                                    value: prompt.title ?? "",
                                                    field: "title",
                                                },
                                                {
                                                    challengeSubmissionPromptId,
                                                    locale,
                                                    value: prompt.promptText ?? "",
                                                    field: "promptText",
                                                },
                                            ]
                                        },
                                    )
                                    .flat()
                                return {
                                    id: challengeSubmissionPromptId,
                                    orderIndex,
                                    title,
                                    score: this.coerceMdScalarService.toRequiredNumber(
                                        score,
                                        0,
                                    ),
                                    promptText,
                                    defaultLocale: Locale.En,
                                    challengeSubmission: {
                                        id: submissionId,
                                    },
                                    translations,
                                }
                            }
                        ),
                    }
                }
            ),
        }
    }

    /**
     * Parses many challenges from the mount.
     *
     * @param courseRelativePath - Course relative path
     * @param moduleRelativePath - Module relative path
     * @param contentRelativePath - Content relative path
     * @param courseIndex - Course index
     * @param moduleIndex - Module index
     * @param contentIndex - Content index
     * @returns Entities-shaped graphs for TypeORM cascade save
     */
    async parseMany(
        {
            contentRelativePath,
            courseIndex,
            moduleIndex,
            contentIndex,
        }: ParseChallengeManyParams,
    ): Promise<Array<ResolvedFileResult<DeepPartial<ChallengeEntity>>>> {
        const paths = await this.challengePathService.paths(
            {
                contentRelativePath,
            },
        )
        const data: Array<ResolvedFileResult<DeepPartial<ChallengeEntity>>> = []
        for (const path of paths) {
            const challenge = await this.parse(
                {
                    paths,
                    courseIndex,
                    moduleIndex,
                    contentIndex,
                    challengeIndex: path.orderIndex,
                },
            )
            data.push({
                data: challenge,
                index: path.orderIndex,
                relativePath: path.relativePath,
            })
        }
        return data
    }
}
