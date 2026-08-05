import {
    createEnumType,
} from "@modules/lib/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Discriminator for which grading pipeline a challenge-submission slot enqueues.
 */
export enum SubmissionType {
    /** Enqueues the Google-Docs processor (URL must pass the Docs validator). */
    GoogleDocsUrl = "googleDocsUrl",
    /** Enqueues the Git processor (URL must pass the GitHub validator; `lang` is required). */
    GithubUrl = "githubUrl",
}

export const GraphQLTypeSubmissionType = createEnumType(SubmissionType)

registerEnumType(
    GraphQLTypeSubmissionType,
    {
        name: "SubmissionType",
        description: "Submission payload kind: Google Docs or GitHub URL.",
        valuesMap: {
            [SubmissionType.GoogleDocsUrl]: {
                description: "A Google Docs URL.",
            },
            [SubmissionType.GithubUrl]: {
                description: "A GitHub repository URL.",
            },
        },
    },
)

