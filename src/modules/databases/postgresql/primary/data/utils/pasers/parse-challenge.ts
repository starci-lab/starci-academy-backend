import {
    DeepPartial
} from "@apollo/client/utilities"
import {
    ChallengeEntity
} from "../../../entities"
import {
    buildChallengeId,
    buildChallengePromptId,
    buildChallengeReferenceId,
    buildChallengeStepId,
    buildChallengeSubmissionId,
    CourseId
} from "../ids"
import {
    extractBlock,
    extractReferences,
    extractSteps,
    extractSubmissions
} from "./extract"
import {
    ChallengeDifficulty,
    Locale
} from "../../../enums"
import {
    envConfig 
} from "@modules/env"
import {
    readFileOrDefault 
} from "../read"

/**
 * Parameters for building a challenge markdown path.
 */
export interface BuildChallengeMarkdownPathParams {
    /**
     * The course id.
     */
    courseId: CourseId
    /**
     * The module index.
     */
    moduleIndex: number
    /**
     * The challenge index.
     */
    challengeIndex: number
    /**
     * The locale.
     */
    locale: Locale
}
/**
 * Resolved path to challenge markdown under the mount:
 * `courses/{course}/modules/{m}/challenges/{c}/challenge/1.{locale}.md`
 * (1-based module and challenge folder indices).
 */
export const buildChallengeMarkdownPath = (
    {
        courseId,
        moduleIndex,
        challengeIndex,
        locale,
    }: BuildChallengeMarkdownPathParams,
) =>
    `${envConfig().mountPath.data.courses}/${courseId.toLowerCase()}/modules/${moduleIndex}/challenges/${challengeIndex}/${locale}.md`

/**
 * Parameters for building a challenge metadata path.
 */
export interface BuildChallengeDataPathParams {
    courseId: CourseId
    moduleIndex: number
    challengeIndex: number
}
/**
 * Resolved path to challenge metadata under the mount:
 * `courses/{course}/modules/{m}/challenges/{c}/metadata.json`
 * (1-based module and challenge folder indices).
 */
export const buildChallengeDataPath = (
    {
        courseId,
        moduleIndex,
        challengeIndex,
    }: BuildChallengeDataPathParams,
) =>
    `${envConfig().mountPath.data.courses}/${courseId.toLowerCase()}/modules/${moduleIndex}/challenges/${challengeIndex}/data.json`
/**
 * Parameters for parsing a challenge.
 */
export interface ParseChallengeParams {
    /**
     * The challenge index.
     */
    index: number
    /**
     * The module index.
     */
    moduleIndex: number
    /**
     * The course id.
     */
    courseId: CourseId
}

/**
 * Prompt for a challenge.
 */
export interface ChallengePrompt {
    /**
     * The title of the prompt in English.
     */
    titleEn: string
    /**
     * The order index of the prompt.
     */
    orderIndex: number
    /**
     * The score of the prompt.
     */
    score: number
    /**
     * The text of the prompt in English.
     */
    textEn: string
}
/**
 * Reference for a challenge.
 */
export interface ChallengeReference {
    /**
     * The alias of the reference.
     */
    alias: Record<Locale, string>
    /**
     * The URL of the reference.
     */
    url: string
    /**
     * The order index of the reference.
     */
    orderIndex: number
}
/**
 * Metadata for a challenge.
 */
export interface ChallengeData {
    /**
     * The difficulty of the challenge.
     */
    difficulty: ChallengeDifficulty
    /**
     * The score of the challenge.
     */
    score: number
    /**
     * The prompts of the challenge.
     */
    prompts: Array<ChallengePrompt>
}
/**
 * Parse the challenge markdown
 * @param params - The parameters for parsing a challenge.
 * @param params.markdown - The challenge markdown.
 * @param params.index - The challenge index.
 * @param params.moduleIndex - The module index.
 * @param params.courseId - The course id.
 * @returns The parsed challenge.
 */
export const parseChallenge = (
    {
        index,
        moduleIndex,
        courseId,
    }: ParseChallengeParams,
): DeepPartial<ChallengeEntity> => {
    // read the challenge markdown
    const enMarkdown = readFileOrDefault(
        buildChallengeMarkdownPath({
            courseId: courseId,
            moduleIndex: moduleIndex,
            challengeIndex: index,
            locale: Locale.En,
        }),
        ""
    )
    const viMarkdown = readFileOrDefault(
        buildChallengeMarkdownPath({
            courseId: courseId,
            moduleIndex: moduleIndex,
            challengeIndex: index,
            locale: Locale.Vi,
        }),
        ""
    )
    const data = JSON.parse(
        readFileOrDefault(
            buildChallengeDataPath({
                courseId: courseId,
                moduleIndex: moduleIndex,
                challengeIndex: index,
            }),
            "{}"
        )
    ) as ChallengeData
    // extract the title
    const enTitle = extractBlock(
        {
            key: "Title",
            markdown: enMarkdown,
            numHashs: 1,
        }
    )
    const viTitle = extractBlock(
        {
            key: "Title",
            markdown: viMarkdown,
            numHashs: 1,
        }
    )
    // extract the description
    const enDescription = extractBlock(
        {
            key: "Description",
            markdown: enMarkdown,
            numHashs: 1,
        }
    )
    const viDescription = extractBlock(
        {
            key: "Description",
            markdown: viMarkdown,
            numHashs: 1,
        }
    )
    // extract the requirements
    const enRequirements = extractBlock(
        {
            key: "Requirements",
            markdown: enMarkdown,
            numHashs: 1,
        }
    )
    const viRequirements = extractBlock(
        {
            key: "Requirements",
            markdown: viMarkdown,
            numHashs: 1,
        }
    )
    // extract the prerequisites
    const enPrerequisites = extractBlock(
        {
            key: "Prerequisites",
            markdown: enMarkdown,
            numHashs: 1,
        }
    )
    const viPrerequisites = extractBlock(
        {
            key: "Prerequisites",
            markdown: viMarkdown,
            numHashs: 1,
        }
    )
    // extract the steps
    const enStepsText = extractBlock(
        {
            key: "Steps",
            markdown: enMarkdown,
            numHashs: 1,
        }
    )
    const viStepsText = extractBlock(
        {
            key: "Steps",
            markdown: viMarkdown,
            numHashs: 1,
        }
    )
    // extract the steps
    const enSteps = extractSteps({
        markdown: enStepsText,
        numHashs: 2,
    })
    const viSteps = extractSteps({
        markdown: viStepsText,
        numHashs: 2,
    })
    // extract the references
    const enReferencesText = extractBlock({
        markdown: enMarkdown,
        key: "References",
        numHashs: 1,
    })
    const viReferencesText = extractBlock({
        markdown: viMarkdown,
        key: "References",
        numHashs: 1,
    })
    // extract the references
    const enReferences = extractReferences({
        markdown: enReferencesText,
    })
    const viReferences = extractReferences({
        markdown: viReferencesText,
    })
    const enSubmissionsText = extractBlock({
        markdown: enMarkdown,
        key: "Submissions",
        numHashs: 1,
    })
    const viSubmissionsText = extractBlock({
        markdown: viMarkdown,
        key: "Submissions",
        numHashs: 1,
    })
    const enSubmissions = extractSubmissions({
        markdown: enSubmissionsText,
    })
    const viSubmissions = extractSubmissions({
        markdown: viSubmissionsText,
    })
    // build the challenge
    const challenge: DeepPartial<ChallengeEntity> = {
        id: buildChallengeId(
            {
                challengeIndex: index,
                moduleIndex: moduleIndex,
                courseId: courseId,
            }
        ),
        defaultLocale: Locale.En,
        title: enTitle,
        difficulty: data.difficulty,
        prerequisites: enPrerequisites,
        requirements: enRequirements,
        description: enDescription,
        translations: [
            // vi translation for title
            {
                challengeId: buildChallengeId(
                    {
                        challengeIndex: index,
                        moduleIndex: moduleIndex,
                        courseId: courseId,
                    }
                ),
                locale: Locale.Vi,
                field: "title",
                value: viTitle,
            },
            // vi translation for description
            {
                challengeId: buildChallengeId(
                    {
                        challengeIndex: index,
                        moduleIndex: moduleIndex,
                        courseId: courseId,
                    }
                ),
                locale: Locale.Vi,
                field: "description",
                value: viDescription,
            },
            // en translation for prerequisites
            {
                challengeId: buildChallengeId(
                    {
                        challengeIndex: index,
                        moduleIndex: moduleIndex,
                        courseId: courseId,
                    }
                ),
                locale: Locale.Vi,
                field: "prerequisites",
                value: viPrerequisites,
            },
            // vi translation for requirements
            {
                challengeId: buildChallengeId(
                    {
                        challengeIndex: index,
                        moduleIndex: moduleIndex,
                        courseId: courseId,
                    }
                ),
                locale: Locale.Vi,
                field: "requirements",
                value: viRequirements,
            },
        ],
        steps: enSteps.map((enStep) => {
            const viStep = viSteps.find((step) => step.index === enStep.index)
            if (!viStep) {
                throw new Error(`Step ${enStep.index} not found in viSteps`)
            }
            return {
                id: buildChallengeStepId(
                    {
                        courseId: courseId,
                        moduleIndex: moduleIndex,
                        challengeIndex: index,
                        stepIndex: viStep.index,
                    }
                ),
                title: enStep.title,
                body: enStep.body,
                orderIndex: enStep.index,
                defaultLocale: Locale.En,
                score: data.score,
                translations: [
                // vi translation for step title
                    {
                        challengeStepId: buildChallengeStepId(
                            {
                                courseId: courseId,
                                moduleIndex: moduleIndex,
                                challengeIndex: index,
                                stepIndex: viStep.index,
                            }
                        ),
                        locale: Locale.Vi,
                        field: "title",
                        value: viStep.title,
                    },
                    // vi translation for step body
                    {
                        challengeStepId: buildChallengeStepId(
                            {
                                courseId: courseId,
                                moduleIndex: moduleIndex,
                                challengeIndex: index,
                                stepIndex: viStep.index,
                            }
                        ),
                        locale: Locale.Vi,
                        field: "body",
                        value: viStep.body,
                    },
                ],
            }
        }),
        prompts: data.prompts.map((prompt) => ({
            id: buildChallengePromptId({
                courseId: courseId,
                moduleIndex: moduleIndex,
                challengeIndex: index,
                promptIndex: prompt.orderIndex,
            }),
            orderIndex: prompt.orderIndex,
            score: prompt.score,
            titleEn: prompt.titleEn,
            textEn: prompt.textEn,
        })),
        references: enReferences.map((enReference) => {
            const viReference = viReferences.find((reference) => reference.orderIndex === enReference.orderIndex)
            if (!viReference) {
                throw new Error(`Reference ${enReference.alias} not found in viReferences`)
            }
            return {
                id: buildChallengeReferenceId({
                    courseId: courseId,
                    moduleIndex: moduleIndex,
                    challengeIndex: index,
                    referenceIndex: enReference.orderIndex,
                }),
                orderIndex: enReference.orderIndex,
                alias: enReference.alias,
                defaultLocale: Locale.En,
                url: enReference.url,
                translations: [
                    {
                        challengeReferenceId: buildChallengeReferenceId({
                            courseId: courseId,
                            moduleIndex: moduleIndex,
                            challengeIndex: index,
                            referenceIndex: enReference.orderIndex,
                        }),
                        locale: Locale.Vi,
                        field: "alias",
                        value: viReference.alias,
                    },
                    {
                        challengeReferenceId: buildChallengeReferenceId({
                            courseId: courseId,
                            moduleIndex: moduleIndex,
                            challengeIndex: index,
                            referenceIndex: enReference.orderIndex,
                        }),
                        locale: Locale.Vi,
                        field: "url",
                        value: viReference.url,
                    },
                ],
            }
        }),
        submissions: enSubmissions.map((enSubmission) => {
            const viSubmission = viSubmissions.find((submission) => submission.orderIndex === enSubmission.orderIndex)
            if (!viSubmission) {
                throw new Error(`Submission order ${enSubmission.orderIndex} (${enSubmission.title}) missing in Vietnamese Submissions`)
            }
            return {
                id: buildChallengeSubmissionId({
                    courseId: courseId,
                    moduleIndex: moduleIndex,
                    challengeIndex: index,
                    submissionIndex: enSubmission.orderIndex,
                }),
                orderIndex: enSubmission.orderIndex,
                defaultLocale: Locale.En,
                type: enSubmission.type,
                title: enSubmission.title,
                description: enSubmission.description,
                translations: [
                    {
                        challengeSubmissionId: buildChallengeSubmissionId({
                            courseId: courseId,
                            moduleIndex: moduleIndex,
                            challengeIndex: index,
                            submissionIndex: enSubmission.orderIndex,
                        }),
                        locale: Locale.Vi,
                        field: "title",
                        value: viSubmission.title,
                    },
                    {
                        challengeSubmissionId: buildChallengeSubmissionId({
                            courseId: courseId,
                            moduleIndex: moduleIndex,
                            challengeIndex: index,
                            submissionIndex: enSubmission.orderIndex,
                        }),
                        locale: Locale.Vi,
                        field: "description",
                        value: viSubmission.description,
                    },
                ],
            }
        }),
    }
    return challenge
}
