import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * The employment arrangement advertised on a job posting (`job_postings.employment_type`).
 */
export enum JobEmploymentType {
    Fulltime = "fulltime",
    Parttime = "parttime",
    Internship = "internship",
    Contract = "contract",
}

export const GraphQLTypeJobEmploymentType = createEnumType(
    JobEmploymentType,
)

registerEnumType(
    GraphQLTypeJobEmploymentType,
    {
        name: "JobEmploymentType",
        description: "Employment arrangement advertised on a job posting.",
        valuesMap: {
            [JobEmploymentType.Fulltime]: {
                description: "Full-time employment.",
            },
            [JobEmploymentType.Parttime]: {
                description: "Part-time employment.",
            },
            [JobEmploymentType.Internship]: {
                description: "Internship position.",
            },
            [JobEmploymentType.Contract]: {
                description: "Fixed-term or freelance contract.",
            },
        },
    },
)
