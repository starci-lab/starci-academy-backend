import {
    createEnumType,
} from "@modules/common"
import {
    registerEnumType 
} from "@nestjs/graphql"

/**
 * Severity of a submission feedback item.
 */
export enum SubmissionFeedbackSeverity {
    /**
     * Low severity.
     */
    Low = "low",
    /**
     * Medium severity.
     */
    Medium = "medium",
    /**
     * High severity.
     */
    High = "high",
}

/**
 * GraphQL type for the submission feedback severity enum.
 */
export const GraphQLTypeSubmissionFeedbackSeverity = createEnumType(
    SubmissionFeedbackSeverity,
)

/**
 * Register the submission feedback severity enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeSubmissionFeedbackSeverity,
    {
        name: "SubmissionFeedbackSeverity",
        description: "Severity of a submission feedback item.",
        valuesMap: {
            [SubmissionFeedbackSeverity.Low]: {
                description: "Low severity.",
            },
            [SubmissionFeedbackSeverity.Medium]: {
                description: "Medium severity.",
            },
            [SubmissionFeedbackSeverity.High]: {
                description: "High severity.",
            },
        },
    })
