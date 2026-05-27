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
} from "@modules/databases"
import {
    ExtractJsonFromMdService,
    CoerceMdScalarService,
} from "../../shared"
import {
    ChallengeIdFactoryService,
    ChallengeOutputIdFactoryService,
    ChallengePrerequisiteIdFactoryService,
    ChallengeSubmissionPromptIdFactoryService,
    ChallengeRequirementIdFactoryService,
    ChallengeStepCodeImplementationIdFactoryService,
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
    ChallengeRequirementEntity,
    ChallengeRequirementTranslationEntity,
    ChallengeStepCodeImplementationEntity,
    ChallengeStepCodeImplementationTranslationEntity,
    ChallengeStepTranslationEntity,
    ChallengeSubmissionPromptEntity,
    ChallengeSubmissionTranslationEntity,
    ChallengeTranslationEntity,
} from "@modules/databases"
import {
    ChallengePathService,
} from "../path"
import {
    ResolvedFileResult,
    ContextLoaderService,
    logInitSeederEntitySkipped,
} from "../../shared"
import {
    ChallengePathNotFoundException,
} from "@modules/exceptions"
import {
    WinstonService,
} from "@modules/winston"

/**
 * Parses challenge from mounted course files (`en.md` / `vi.md`).
 * Scalar fields like `difficulty`, `score` use camelCase `#` headings in `en.md`.
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
        private readonly challengeStepCodeImplementationIdFactoryService: ChallengeStepCodeImplementationIdFactoryService,
        private readonly challengeReferenceIdFactoryService: ChallengeReferenceIdFactoryService,
        private readonly challengeRequirementIdFactoryService: ChallengeRequirementIdFactoryService,
        private readonly challengeOutputIdFactoryService: ChallengeOutputIdFactoryService,
        private readonly challengePrerequisiteIdFactoryService: ChallengePrerequisiteIdFactoryService,
        private readonly contentIdFactoryService: ContentIdFactoryService,
        private readonly winstonService: WinstonService,
    ) { }

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
                    await this.contextLoaderService.load("courses",
                        `${path.relativePath}/${locale}.md`),
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
            requirements: (
                (jsonMap.get(Locale.En)?.requirements as Array<Partial<ChallengeRequirementEntity> & { score?: number, promptText?: string }>) ?? []
            ).map(({
                orderIndex,
                purpose,
                technicalConstraints,
                proTipsHints,
                forbidden,
                score,
                promptText,
            }) => {
                const requirementId = this.challengeRequirementIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        requirementIndex: orderIndex ?? 0,
                    },
                )
                const translations = Array.from(jsonMap.entries()).map(
                    ([
                        locale,
                        challenge,
                    ]) => ((challenge.requirements as Array<Partial<ChallengeRequirementEntity>>) ?? [])
                        .filter((requirement) => requirement.orderIndex === orderIndex)
                        .map((requirement) => [
                            {
                                challengeRequirementId: requirementId,
                                locale,
                                field: "purpose",
                                value: requirement.purpose ?? "",
                            },
                            {
                                challengeRequirementId: requirementId,
                                locale,
                                field: "technicalConstraints",
                                value: requirement.technicalConstraints ?? "",
                            },
                            {
                                challengeRequirementId: requirementId,
                                locale,
                                field: "proTipsHints",
                                value: requirement.proTipsHints ?? "",
                            },
                            {
                                challengeRequirementId: requirementId,
                                locale,
                                field: "forbidden",
                                value: requirement.forbidden ?? "",
                            },
                            {
                                challengeRequirementId: requirementId,
                                locale,
                                field: "promptText",
                                value: requirement.promptText ?? "",
                            },
                        ] as Array<DeepPartial<ChallengeRequirementTranslationEntity>>)
                ).flat().flat()
                return {
                    id: requirementId,
                    orderIndex: orderIndex ?? 0,
                    purpose,
                    technicalConstraints,
                    proTipsHints,
                    forbidden,
                    promptText,
                    score: this.coerceMdScalarService.toRequiredNumber(score,
                        0),
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations,
                }
            }),
            outputs: (
                jsonMap.get(Locale.En)?.outputs ?? []
            ).map(({
                orderIndex,
                text,
            }) => {
                const outputId = this.challengeOutputIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        outputIndex: orderIndex,
                    },
                )
                const translations = Array.from(jsonMap.entries()).map(
                    ([
                        locale,
                        challenge,
                    ]) => (challenge.outputs ?? [])
                        .filter((output) => output.orderIndex === orderIndex)
                        .map((output) => ({
                            challengeOutputId: outputId,
                            locale,
                            field: "text",
                            value: output.text,
                        } as DeepPartial<ChallengeOutputTranslationEntity>))
                ).flat()
                return {
                    id: outputId,
                    orderIndex,
                    text,
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations,
                }
            }),
            prerequisites: (
                jsonMap.get(Locale.En)?.prerequisites ?? []
            ).map(({
                orderIndex,
                text,
            }) => {
                const prerequisiteId = this.challengePrerequisiteIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        prerequisiteIndex: orderIndex,
                    },
                )
                const translations = Array.from(jsonMap.entries()).map(
                    ([
                        locale,
                        challenge,
                    ]) => (challenge.prerequisites ?? [])
                        .filter((prerequisite) => prerequisite.orderIndex === orderIndex)
                        .map((prerequisite) => ({
                            challengePrerequisiteId: prerequisiteId,
                            locale,
                            field: "text",
                            value: prerequisite.text,
                        } as DeepPartial<ChallengePrerequisiteTranslationEntity>))
                ).flat()
                return {
                    id: prerequisiteId,
                    orderIndex,
                    text,
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations,
                }
            }),
            references: (
                jsonMap.get(Locale.En)?.references ?? []
            ).map(({
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
                const translations = Array.from(jsonMap.entries()).map(
                    ([
                        locale,
                        challenge,
                    ]) => (challenge.references ?? [])
                        .filter((reference) => reference.orderIndex === orderIndex)
                        .map<DeepPartial<ChallengeReferenceTranslationEntity>>(
                            (reference) => ({
                                challengeReferenceId: referenceId,
                                locale,
                                field: "alias",
                                value: reference.alias ?? "",
                            }),
                        )
                ).flat()
                return {
                    id: referenceId,
                    orderIndex,
                    alias,
                    url,
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations,
                }
            }),
            steps: (
                jsonMap.get(Locale.En)?.steps ?? []
            ).map(({
                orderIndex,
                title,
                body,
                codeImplementations,
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
                const stepTitle = this.coerceMdScalarService.toRequiredString(
                    title,
                    "",
                )
                const bodyMarkdown = this.coerceMdScalarService.toRequiredString(body,
                    "")
                const codeImplementationsParsed = (
                    (
                        codeImplementations as Array<Partial<ChallengeStepCodeImplementationEntity>> | undefined
                    ) ?? []
                ).map((implementation) => {
                    const implementationOrderIndex = implementation.orderIndex ?? 0
                    const implementationId = this.challengeStepCodeImplementationIdFactoryService.generate({
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        stepIndex: orderIndex,
                        implementationIndex: implementationOrderIndex,
                    })
                    const lang = this.coerceMdScalarService.toRequiredString(implementation.lang,
                        "text")
                    const guide = this.coerceMdScalarService.toRequiredString(implementation.guide,
                        "")
                    const example = this.coerceMdScalarService.toRequiredString(implementation.example,
                        "")
                    const implTranslations: Array<DeepPartial<ChallengeStepCodeImplementationTranslationEntity>> = []
                    for (const locale of Object.values(Locale)) {
                        const challenge = jsonMap.get(locale)
                        const localeStep = (challenge?.steps ?? []).find(
                            (step) => step.orderIndex === orderIndex,
                        )
                        const localeImplementation = (
                            localeStep?.codeImplementations as Array<Partial<ChallengeStepCodeImplementationEntity>> | undefined
                        )?.find(
                            (row) => row.orderIndex === implementationOrderIndex,
                        )
                        if (!localeImplementation) {
                            continue
                        }
                        implTranslations.push({
                            challengeStepCodeImplementationId: implementationId,
                            locale,
                            field: "guide",
                            value: this.coerceMdScalarService.toRequiredString(
                                localeImplementation.guide,
                                ""
                            ),
                        })
                        implTranslations.push({
                            challengeStepCodeImplementationId: implementationId,
                            locale,
                            field: "example",
                            value: this.coerceMdScalarService.toRequiredString(
                                localeImplementation.example,
                                ""
                            ),
                        })
                    }
                    return {
                        id: implementationId,
                        orderIndex: implementationOrderIndex,
                        lang,
                        guide,
                        example,
                        defaultLocale: Locale.En,
                        challengeStep: {
                            id: stepId,
                        },
                        translations: implTranslations,
                    }
                })
                const translations = Array.from(jsonMap.entries()).map(
                    ([
                        locale,
                        challenge,
                    ]) => (challenge.steps ?? [])
                        .filter((step) => step.orderIndex === orderIndex)
                        .map<Array<DeepPartial<ChallengeStepTranslationEntity>>>((step) => [
                            {
                                challengeStepId: stepId,
                                locale,
                                value: step.title ?? "",
                                field: "title",
                            },
                            {
                                challengeStepId: stepId,
                                locale,
                                value: this.coerceMdScalarService.toRequiredString(
                                    step.body,
                                    ""),
                                field: "body",
                            },
                        ])
                ).flat().flat()
                return {
                    id: stepId,
                    orderIndex,
                    title: stepTitle,
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    body: bodyMarkdown,
                    codeImplementations: codeImplementationsParsed,
                    translations,
                }
            }),
            submissions: (
                jsonMap.get(Locale.En)?.submissions ?? []
            ).map(({
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
                const translations = Array.from(jsonMap.entries()).map(
                    ([
                        locale,
                        challenge,
                    ]) => (challenge.submissions ?? [])
                        .filter((submission) => submission.orderIndex === submissionOrderIndex)
                        .map<Array<DeepPartial<ChallengeSubmissionTranslationEntity>>>(
                            (submission) => [
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
                            ],
                        )
                ).flat().flat()
                return {
                    id: submissionId,
                    orderIndex: submissionOrderIndex,
                    title,
                    description: this.coerceMdScalarService.toNullableStringColumn(
                        description,
                    ),
                    type: (type as SubmissionType) ?? SubmissionType.GithubUrl,
                    score: this.coerceMdScalarService.toRequiredNumber(
                        score,
                        0,
                    ),
                    defaultLocale: Locale.En,
                    challenge: {
                        id: challengeId,
                    },
                    translations,
                    prompts: (prompts ?? []).map<DeepPartial<ChallengeSubmissionPromptEntity>>(
                        ({
                            orderIndex,
                            title,
                            score,
                            promptText,
                        }) => {
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
                            const translations = Array.from(jsonMap.entries()).map(
                                ([
                                    locale,
                                    challenge,
                                ]) => {
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
                            ).flat()
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
            }),
        }
    }

    /**
     * Parses many challenges from the mount.
     *
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
            try {
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
            } catch (error) {
                logInitSeederEntitySkipped(
                    this.winstonService,
                    ChallengeEntity,
                    path.relativePath,
                    error,
                )
            }
        }
        return data
    }
}

