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
            references: (referencesMap.get(Locale.En) ?? []).map(
                (reference) => {
                    const referenceId = this.challengeReferenceIdFactoryService.generate(
                        {
                            courseIndex,
                            moduleIndex,
                            challengeIndex,
                            referenceIndex: reference.orderIndex,
                        },
                    )
                    const translations = Array.from(referencesMap.entries()).map((
                        [
                            locale,
                            references
                        ]
                    ) => references.map((reference) => ({
                        referenceId,
                        locale,
                        field: "alias",
                        value: reference.alias,
                    }))).flat().flat()
                    return {
                        id: referenceId,
                        orderIndex: reference.orderIndex,
                        alias: reference.alias,
                        translations,
                    }
                }
            ),
            steps: (stepsMap.get(Locale.En) ?? []).map(
                (step) => {
                    const translations = Array.from(stepsMap.entries()).map((
                        [
                            locale,
                            steps
                        ]
                    ) => steps.map((step) => {
                        return [
                            (
                                {
                                    locale,
                                    title: step.title,
                                    body: step.body,
                                    field: "title",
                                }
                            ),
                            (
                                {
                                    locale,
                                    title: step.title,
                                    body: step.body,
                                    field: "body",
                                }
                            )
                        ]
                    }
                    )).flat().flat()
                    const stepId = this.challengeStepIdFactoryService.generate(
                        {
                            courseIndex,
                            moduleIndex,
                            challengeIndex,
                            stepIndex: step.index,
                        },
                    )
                    return {
                        id: stepId,
                        orderIndex: step.index,
                        title: step.title,
                        body: step.body,
                        translations,
                    }
                }),
            submissions: (
                submissionsMap.get(Locale.En) ?? []).map(
                (submission) => {
                    const translations = Array.from(
                        submissionsMap.entries()
                    ).map((
                        [
                            locale,
                            submissions
                        ]
                    ) => {
                        return submissions.map((submission) => [({
                            locale,
                            title: submission.title,
                            description: submission.description,
                            field: "title",
                        }),
                        ({
                            locale,
                            title: submission.title,
                            description: submission.description,
                            field: "description",
                        })])
                    }).flat().flat()
                    const submissionId = this.challengeSubmissionIdFactoryService.generate(
                        {
                            courseIndex,
                            moduleIndex,
                            challengeIndex,
                            submissionIndex: submission.orderIndex,
                        },
                    )
                    const prompts: Array<DeepPartial<ChallengeSubmissionPromptEntity>> = []
                    for (const prompt of dataJson.prompts) {
                        const promptId = this.challengeSubmissionPromptIdFactoryService.generate(
                            {
                                courseIndex,
                                moduleIndex,
                                challengeIndex,
                                submissionIndex: submission.orderIndex,
                                promptIndex: prompt.orderIndex,
                            },
                        )
                        const translations: Array<DeepPartial<ChallengeSubmissionPromptTranslationEntity>> = []
                        const titleVi = prompt.titleVi?.trim()
                        if (titleVi) {
                            translations.push(
                                {
                                    challengeSubmissionPromptId: promptId,
                                    locale: Locale.Vi,
                                    field: "title",
                                    value: titleVi,
                                },
                            )
                        }
                        const textVi = prompt.textVi?.trim()
                        if (textVi) {
                            translations.push(
                                {
                                    challengeSubmissionPromptId: promptId,
                                    locale: Locale.Vi,
                                    field: "text",
                                    value: textVi,
                                },
                            )
                        }
                        prompts.push(
                            {
                                id: promptId,
                                challengeSubmissionId: submissionId,
                                orderIndex: prompt.orderIndex,
                                titleEn: prompt.titleEn,
                                textEn: prompt.textEn,
                                score: prompt.score,
                                translations,
                            },
                        )
                    }
                    return {
                        id: submissionId,
                        orderIndex: submission.orderIndex,
                        title: submission.title,
                        description: submission.description,
                        translations,
                        prompts,
                    }
                }
            ),
        }
    }
}