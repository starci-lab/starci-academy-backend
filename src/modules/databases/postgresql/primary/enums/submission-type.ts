import {
    createEnumType,
} from "@modules/common"
import {
    registerEnumType,
} from "@nestjs/graphql"

export enum SubmissionType {
    GoogleDocsUrl = "googleDocsUrl",
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

