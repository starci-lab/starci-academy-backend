import type {
    ChallengeDataJson,
    ChallengeIndexesParams,
    ExtractChallengeBlockBothParams,
    ExtractChallengeBlockBothResult,
    ListChallengeIndexesResult,
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
    ChallengeSeedReferenceViMissingException,
    ChallengeSeedStepViMissingException,
    ChallengeSeedSubmissionViMissingException,
} from "@modules/exceptions"
import {
    envConfig,
} from "@modules/env"
import {
    Locale,
} from "../../../enums"
import {
    ExtractBlockService,
    ExtractReferencesService,
    ExtractStepsService,
    ExtractSubmissionsService,
} from "../extracts"
import {
    ChallengeIdFactoryService,
    ChallengePromptIdFactoryService,
    ChallengeReferenceIdFactoryService,
    ChallengeStepIdFactoryService,
    ChallengeSubmissionIdFactoryService,
} from "../id-factories"
import {
    courseAlias,
} from "../utils"
import {
    listNumericChildDirectoryIndices,
} from "./utils"
import {
    DeepPartial 
} from "typeorm"
import {
    ChallengeEntity 
} from "../../../entities"

/**
 * Parses challenge markdown (`en.md`, `vi.md`) and `data.json` into a challenge entity seed payload.
 */
@Injectable()
export class ChallengeParserService {
    constructor(
        private readonly extractBlockService: ExtractBlockService,
        private readonly extractStepsService: ExtractStepsService,
        private readonly extractReferencesService: ExtractReferencesService,
        private readonly extractSubmissionsService: ExtractSubmissionsService,
        private readonly challengeIdFactoryService: ChallengeIdFactoryService,
        private readonly challengeStepIdFactoryService: ChallengeStepIdFactoryService,
        private readonly challengePromptIdFactoryService: ChallengePromptIdFactoryService,
        private readonly challengeReferenceIdFactoryService: ChallengeReferenceIdFactoryService,
        private readonly challengeSubmissionIdFactoryService: ChallengeSubmissionIdFactoryService,
    ) {}

    /**
     * Reads the same top-level markdown section in English and Vietnamese.
     *
     * @param param - Heading key and both locale documents
     * @returns Trimmed section bodies per locale
     */
    private extractBlockBoth(
        {
            key,
            enMarkdown,
            viMarkdown,
            numHashs = 1,
        }: ExtractChallengeBlockBothParams,
    ): ExtractChallengeBlockBothResult {
        return {
            en: this.extractBlockService.extract(
                {
                    key,
                    markdown: enMarkdown,
                    numHashs,
                },
            ),
            vi: this.extractBlockService.extract(
                {
                    key,
                    markdown: viMarkdown,
                    numHashs,
                },
            ),
        }
    }

    /**
     * Base directory for a challenge’s `en.md`, `vi.md`, and `data.json`.
     *
     * @param param - Course, module, and challenge indices
     * @returns Absolute path to the challenge folder
     */
    private path(
        {
            courseIndex,
            moduleIndex,
            challengeIndex,
        }: ParseChallengeParams,
    ): string {
        return `${
            envConfig().mountPath.data.courses}/${courseAlias(courseIndex)}/modules/${moduleIndex}/challenges/${challengeIndex}`
    }

    /**
     * Builds a partial challenge entity from mounted course files.
     *
     * @param param - Course, module, and challenge indices
     * @returns Entity-shaped object suitable for TypeORM insert/merge
     */
    parse(
        {
            courseIndex,
            moduleIndex,
            challengeIndex,
        }: ParseChallengeParams,
    ): DeepPartial<ChallengeEntity> {
        const path = this.path(
            {
                courseIndex,
                moduleIndex,
                challengeIndex,
            },
        )

        // load locale markdown and structured JSON
        const enMarkdown = readMdFileOrDefault(`${path}/en.md`)
        const viMarkdown = readMdFileOrDefault(`${path}/vi.md`)
        const dataJson = readJsonFileOrDefault<ChallengeDataJson>(`${path}/data.json`)

        // top-level sections (same keys in both locales)
        const title = this.extractBlockBoth(
            {
                key: "Title",
                enMarkdown,
                viMarkdown,
            },
        )
        const description = this.extractBlockBoth(
            {
                key: "Description",
                enMarkdown,
                viMarkdown,
            },
        )
        const requirements = this.extractBlockBoth(
            {
                key: "Requirements",
                enMarkdown,
                viMarkdown,
            },
        )
        const prerequisites = this.extractBlockBoth(
            {
                key: "Prerequisites",
                enMarkdown,
                viMarkdown,
            },
        )

        // steps: outer section then numbered `##` blocks
        const stepsOuter = this.extractBlockBoth(
            {
                key: "Steps",
                enMarkdown,
                viMarkdown,
            },
        )
        const enSteps = this.extractStepsService.extract(
            {
                markdown: stepsOuter.en,
                numHashs: 2,
            },
        )
        const viSteps = this.extractStepsService.extract(
            {
                markdown: stepsOuter.vi,
                numHashs: 2,
            },
        )

        // references and submissions
        const referencesOuter = this.extractBlockBoth(
            {
                key: "References",
                enMarkdown,
                viMarkdown,
            },
        )
        const enReferences = this.extractReferencesService.extract(
            {
                markdown: referencesOuter.en,
            },
        )
        const viReferences = this.extractReferencesService.extract(
            {
                markdown: referencesOuter.vi,
            },
        )

        const submissionsOuter = this.extractBlockBoth(
            {
                key: "Submissions",
                enMarkdown,
                viMarkdown,
            },
        )
        const enSubmissions = this.extractSubmissionsService.extract(
            {
                markdown: submissionsOuter.en,
            },
        )
        const viSubmissions = this.extractSubmissionsService.extract(
            {
                markdown: submissionsOuter.vi,
            },
        )

        // stable id for nested relations and translations
        const challengeId = this.challengeIdFactoryService.generate(
            {
                courseIndex,
                moduleIndex,
                challengeIndex,
            },
        )

        // assemble entity graph
        return {
            id: challengeId,
            defaultLocale: Locale.En,
            title: title.en,
            difficulty: dataJson.difficulty,
            prerequisites: prerequisites.en,
            requirements: requirements.en,
            description: description.en,
            translations: [
                {
                    challengeId,
                    locale: Locale.Vi,
                    field: "title",
                    value: title.vi,
                },
                {
                    challengeId,
                    locale: Locale.Vi,
                    field: "description",
                    value: description.vi,
                },
                {
                    challengeId,
                    locale: Locale.Vi,
                    field: "prerequisites",
                    value: prerequisites.vi,
                },
                {
                    challengeId,
                    locale: Locale.Vi,
                    field: "requirements",
                    value: requirements.vi,
                },
            ],
            steps: enSteps.map((enStep) => {
                const viStep = viSteps.find((step) => step.index === enStep.index)
                if (!viStep) {
                    throw new ChallengeSeedStepViMissingException(
                        {
                            courseIndex,
                            moduleIndex,
                            challengeIndex,
                            stepIndex: enStep.index,
                        },
                    )
                }
                const stepId = this.challengeStepIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        challengeIndex,
                        stepIndex: viStep.index,
                    },
                )
                return {
                    id: stepId,
                    title: enStep.title,
                    body: enStep.body,
                    orderIndex: enStep.index,
                    defaultLocale: Locale.En,
                    score: dataJson.score,
                    translations: [
                        {
                            challengeStepId: stepId,
                            locale: Locale.Vi,
                            field: "title",
                            value: viStep.title,
                        },
                        {
                            challengeStepId: stepId,
                            locale: Locale.Vi,
                            field: "body",
                            value: viStep.body,
                        },
                    ],
                }
            }),
            prompts: dataJson.prompts.map((prompt) => ({
                id: this.challengePromptIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        challengeIndex,
                        promptIndex: prompt.orderIndex,
                    },
                ),
                orderIndex: prompt.orderIndex,
                score: prompt.score,
                titleEn: prompt.titleEn,
                textEn: prompt.textEn,
            })),
            references: enReferences.map((enReference) => {
                const viReference = viReferences.find(
                    (reference) => reference.orderIndex === enReference.orderIndex,
                )
                if (!viReference) {
                    throw new ChallengeSeedReferenceViMissingException(
                        {
                            courseIndex,
                            moduleIndex,
                            challengeIndex,
                            orderIndex: enReference.orderIndex,
                            alias: enReference.alias,
                        },
                    )
                }
                const referenceId = this.challengeReferenceIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        challengeIndex,
                        referenceIndex: enReference.orderIndex,
                    },
                )
                return {
                    id: referenceId,
                    orderIndex: enReference.orderIndex,
                    alias: enReference.alias,
                    defaultLocale: Locale.En,
                    url: enReference.url,
                    translations: [
                        {
                            challengeReferenceId: referenceId,
                            locale: Locale.Vi,
                            field: "alias",
                            value: viReference.alias,
                        },
                        {
                            challengeReferenceId: referenceId,
                            locale: Locale.Vi,
                            field: "url",
                            value: viReference.url,
                        },
                    ],
                }
            }),
            submissions: enSubmissions.map((enSubmission) => {
                const viSubmission = viSubmissions.find(
                    (submission) => submission.orderIndex === enSubmission.orderIndex,
                )
                if (!viSubmission) {
                    throw new ChallengeSeedSubmissionViMissingException(
                        {
                            courseIndex,
                            moduleIndex,
                            challengeIndex,
                            orderIndex: enSubmission.orderIndex,
                            title: enSubmission.title,
                        },
                    )
                }
                const submissionId = this.challengeSubmissionIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        challengeIndex,
                        submissionIndex: enSubmission.orderIndex,
                    },
                )
                return {
                    id: submissionId,
                    orderIndex: enSubmission.orderIndex,
                    defaultLocale: Locale.En,
                    type: enSubmission.type,
                    title: enSubmission.title,
                    description: enSubmission.description,
                    translations: [
                        {
                            challengeSubmissionId: submissionId,
                            locale: Locale.Vi,
                            field: "title",
                            value: viSubmission.title,
                        },
                        {
                            challengeSubmissionId: submissionId,
                            locale: Locale.Vi,
                            field: "description",
                            value: viSubmission.description,
                        },
                    ],
                }
            }),
        }
    }

    /**
     * Lists numeric `challenges/{n}/` indices on the mount for a module.
     *
     * @param param - Course and module ordinals
     * @returns Sorted challenge folder indices
     */
    indexes(
        {
            courseIndex,
            moduleIndex,
        }: ChallengeIndexesParams,
    ): ListChallengeIndexesResult {
        return listNumericChildDirectoryIndices(
            `${envConfig().mountPath.data.courses}/${courseAlias(courseIndex)}/modules/${moduleIndex}/challenges`,
        )
    }
}
