import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/lib/common/utils/enum"

/**
 * The employment arrangement advertised on a job posting (`job_postings.employment_type`).
 */
export enum JobEmploymentType {
    /** Posting matches full-time-only recruiter / catalog filters. */
    Fulltime = "fulltime",
    /** Posting matches part-time-only filters (excluded from full-time lists). */
    Parttime = "parttime",
    /** Posting matches internship filters. */
    Internship = "internship",
    /** Posting matches contract / freelance filters. */
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
