import type {
    ChallengeDataJson,
    ExtractParams,
    ExtractResult,
    ParseChallengeParams,
} from "./types"
import {
    Injectable,
} from "@nestjs/common"
import {
    readJsonFileOrDefault,
    readMdFileOrDefault,
} from "@modules/common"
import {
    Locale,
} from "../../../enums"
import {
    ExtractBlockService,
    ExtractReferencesResult,
    ExtractReferencesService,
    ExtractStepsResult,
    ExtractStepsService,
    ExtractSubmissionPromptsResult,
    ExtractSubmissionPromptsService,
    ExtractSubmissionsResult,
    ExtractSubmissionsService,
} from "../extracts"
import {
    ChallengeIdFactoryService,
    ChallengeSubmissionPromptIdFactoryService,
    ChallengeStepIdFactoryService,
    ChallengeSubmissionIdFactoryService,
    ChallengeReferenceIdFactoryService,
} from "../id-factories"
import {
    DeepPartial,
} from "typeorm"
import {
    ChallengeEntity,
    ChallengeStepTranslationEntity,
    ChallengeSubmissionPromptEntity,
    ChallengeSubmissionPromptTranslationEntity,
    ChallengeTranslationEntity,
} from "../../../entities"
import {
    ChallengeDirService,
} from "../dir"

/**
 * Parses challenge from mounted course files.
 */
@Injectable()
export class ChallengeParserService {
    constructor(
        private readonly challengeDirService: ChallengeDirService,
        private readonly extractBlockService: ExtractBlockService,
        private readonly extractSubmissionsService: ExtractSubmissionsService,
        private readonly extractSubmissionPromptsService: ExtractSubmissionPromptsService,
        private readonly challengeIdFactoryService: ChallengeIdFactoryService,
        private readonly challengeSubmissionPromptIdFactoryService: ChallengeSubmissionPromptIdFactoryService,
        private readonly challengeSubmissionIdFactoryService: ChallengeSubmissionIdFactoryService,
        private readonly extractStepsService: ExtractStepsService,
        private readonly challengeStepIdFactoryService: ChallengeStepIdFactoryService,
        private readonly extractReferencesService: ExtractReferencesService,
        private readonly challengeReferenceIdFactoryService: ChallengeReferenceIdFactoryService,
    ) { }

    /**
     * Reads the same top-level markdown section in many locales.
     *
     * @param param - Heading key and locale markdown map
     * @returns Trimmed section bodies per locale
     */
    private extract(
        {
            key,
            markdownMap,
        }: ExtractParams,
    ): ExtractResult {
        const result = new Map<Locale, string>()
        for (const locale of Object.values(Locale)) {
            result.set(
                locale,
                this.extractBlockService.extract(
                    {
                        key,
                        markdown: markdownMap.get(locale) ?? "",
                        numHashs: 3,
                    },
                )
            )
        }
        return result
    }

    /**
     * Builds a partial challenge entity from mounted course files.
     */
    parse(
        {
            courseIndex,
            moduleIndex,
            challengeIndex,
        }: ParseChallengeParams,
    ): DeepPartial<ChallengeEntity> {
        const {
            path,
            displayId,
        } = this.challengeDirService.path(
            {
                courseIndex,
                moduleIndex,
                challengeIndex,
            },
        )
        const markdownMap = new Map<Locale, string>()
        for (const locale of Object.values(Locale)) {
            markdownMap.set(
                locale,
                readMdFileOrDefault(`${path}/${locale}.md`)
            )
        }
        const dataJson = readJsonFileOrDefault<ChallengeDataJson>(`${path}/data.json`)

        const titleMap = this.extract(
            {
                key: "Title",
                markdownMap,
            },
        )
        const descriptionMap = this.extract(
            {
                key: "Description",
                markdownMap,
            },
        )

        const submissionsTextMap = this.extract(
            {
                key: "Submissions",
                markdownMap,
            },
        )

        const requirementsMap = this.extract(
            {
                key: "Requirements",
                markdownMap,
            },
        )

        const prerequisitesMap = this.extract(
            {
                key: "Prerequisites",
                markdownMap,
            },
        )

        const submissionsMap = new Map<Locale, ExtractSubmissionsResult>()
        for (const locale of Object.values(Locale)) {
            submissionsMap.set(
                locale,
                this.extractSubmissionsService.extract(
                    {
                        markdown: submissionsTextMap.get(locale) ?? "",
                    },
                )
            )
        }

        const stepsTextMap = this.extract(
            {
                key: "Steps",
                markdownMap,
            },
        )
        const stepsMap = new Map<Locale, ExtractStepsResult>()
        for (const locale of Object.values(Locale)) {
            stepsMap.set(
                locale,
                this.extractStepsService.extract(
                    {
                        markdown: stepsTextMap.get(locale) ?? "",
                    },
                )
            )
        }
        const referencesTextMap = this.extract(
            {
                key: "References",
                markdownMap,
            },
        )
        const referencesMap = new Map<Locale, ExtractReferencesResult>()
        for (const locale of Object.values(Locale)) {
            referencesMap.set(locale,
                this.extractReferencesService.extract(
                    {
                        markdown: referencesTextMap.get(locale) ?? "",
                    },
                )
            )
        }
        const promptsMap = new Map<Locale, ExtractSubmissionPromptsResult>()
        for (const locale of Object.values(Locale)) {
            promptsMap.set(
                locale,
                this.extractSubmissionPromptsService.extract(
                    {
                        markdown: submissionsTextMap.get(locale) ?? "",
                    },
                )
            )
        }
        const challengeId = this.challengeIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
                challengeIndex,
            },
        )

        return {
            id: challengeId,
            defaultLocale: Locale.En,
            displayId,
            title: titleMap.get(Locale.En) ?? "",
            description: descriptionMap.get(Locale.En) ?? "",
            requirements: requirementsMap.get(Locale.En) ?? "",
            prerequisites: prerequisitesMap.get(Locale.En) ?? "",
            difficulty: dataJson.difficulty,
            score: dataJson.score,
            orderIndex: challengeIndex,
            translations: (() => {
                const translations: Array<DeepPartial<ChallengeTranslationEntity>> = []
                for (const locale of Object.values(Locale)) {
                    translations.push({
                        challengeId,
                        locale,
                        field: "title",
                        value: titleMap.get(locale) ?? "",
                    })
                    translations.push({
                        challengeId,
                        locale,
                        field: "description",
                        value: descriptionMap.get(locale) ?? "",
                    })
                    translations.push({
                        challengeId,
                        locale,
                        field: "requirements",
                        value: requirementsMap.get(locale) ?? "",
                    })
                    translations.push({
                        challengeId,
                        locale,
                        field: "prerequisites",
                        value: prerequisitesMap.get(locale) ?? "",
                    })
                }
                return translations
            })(),
            references: (referencesMap.get(Locale.En) ?? [])
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
                                challengeIndex,
                                referenceIndex: orderIndex,
                            },
                        )
                        const translations = Array.from(referencesMap.entries())
                            .filter((
                                [
                                    , references
                                ]
                            ) => references.filter(
                                (reference) => reference.orderIndex === orderIndex)
                            )
                            .map((
                                [
                                    locale,
                                    references
                                ]
                            ) => references
                                .map(
                                    (reference) => (
                                        {
                                            referenceId,
                                            locale,
                                            field: "alias",
                                            value: reference.alias,
                                        }
                                    )
                                )
                            )
                            .flat()
                        return {
                            id: referenceId,
                            orderIndex,
                            alias,
                            url,
                            defaultLocale: Locale.En,
                            translations,
                            challengeId
                        }
                    }
                ),
            steps: (
                stepsMap.get(Locale.En) ?? []).map(
                ({
                    orderIndex,
                    title,
                    body,
                }) => {
                    const stepId = this.challengeStepIdFactoryService.generate(
                        {
                            courseIndex,
                            moduleIndex,
                            challengeIndex,
                            stepIndex: orderIndex,
                        },
                    )
                    const translations = Array.from(stepsMap.entries())
                        .filter(
                            (
                                [,
                                    steps
                                ]
                            ) => steps.filter((step) => step.orderIndex === orderIndex))
                        .map((
                            [
                                locale,
                                steps
                            ]
                        ) => steps.map<Array<DeepPartial<ChallengeStepTranslationEntity>>>((step) => {
                            return [
                                (
                                    {
                                        challengeStepId: stepId,
                                        locale,
                                        title: step.title,
                                        value: step.body,
                                        field: "title",
                                    }
                                ),
                                (
                                    {
                                        challengeStepId: stepId,
                                        locale,
                                        title: step.title,
                                        value: step.body,
                                        field: "body",
                                    }
                                )
                            ]
                        }
                        )).flat().flat()
                    return {
                        id: stepId,
                        orderIndex,
                        title,
                        defaultLocale: Locale.En,
                        challengeId,
                        body,
                        translations,
                    }
                }
            ),
            submissions: (
                submissionsMap.get(Locale.En) ?? []).map(
                ({ orderIndex, title, description, type }) => {
                    const submissionId = this.challengeSubmissionIdFactoryService.generate(
                        {
                            courseIndex,
                            moduleIndex,
                            challengeIndex,
                            submissionIndex: orderIndex,
                        },
                    )
                    const translations = Array.from(
                        submissionsMap.entries()
                    )
                        .filter((
                            [,
                                submissions
                            ]
                        ) => submissions.filter((submission) => submission.orderIndex === orderIndex))
                        .map((
                            [
                                locale,
                                submissions
                            ]
                        ) => {
                            return submissions.map((submission) => [
                                {
                                    submissionId,
                                    locale,
                                    description: submission.description,
                                    field: "title",
                                    value: submission.title,
                                },
                                {
                                    submissionId,
                                    locale,
                                    description: submission.description,
                                    field: "description",
                                    value: submission.description,
                                }
                            ]
                            )
                        }).flat().flat()
                    return {
                        id: submissionId,
                        orderIndex,
                        title,
                        description,
                        defaultLocale: Locale.En,
                        translations,
                        prompts: (promptsMap.get(Locale.En) ?? [])
                            .map<DeepPartial<ChallengeSubmissionPromptEntity>>(
                                (prompt) => {
                                    const promptId = this.challengeSubmissionPromptIdFactoryService.generate(
                                        {
                                            courseIndex,
                                            moduleIndex, 
                                            challengeIndex,
                                            submissionIndex: orderIndex,
                                            promptIndex: prompt.orderIndex,
                                        },
                                    )
                                    const translations = Array.from(promptsMap.entries())
                                        .filter((
                                            [,
                                                prompts
                                            ]
                                        ) => prompts.filter((prompt) => prompt.orderIndex === prompt.orderIndex))
                                        .map((
                                            [
                                                locale,
                                                prompts
                                            ]
                                        ) => prompts.map<Array<DeepPartial<ChallengeSubmissionPromptTranslationEntity>>>((prompt) => [
                                            {
                                                challengeSubmissionPromptId: promptId,
                                                locale,
                                                field: "title",
                                                value: prompt.title,
                                            },
                                            {
                                                challengeSubmissionPromptId: promptId,
                                                locale,
                                                field: "promptText",
                                                value: prompt.text,
                                            }
                                        ]
                                        )
                                        ).flat().flat()
                                    return {
                                        id: promptId,
                                        orderIndex,
                                        score: prompt.score,
                                        challengeSubmissionId: submissionId,
                                        title: prompt.title,
                                        promptText: prompt.text,
                                        defaultLocale: Locale.En,
                                        translations,
                                        type,
                                    }
                                }
                            )
                    }
                }
            )
        }
    }   
}