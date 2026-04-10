import {
    Field,
    ID,
    InputType,
    registerEnumType,
} from "@nestjs/graphql"
import {
    PaginationPageFilters,
    SortInput,
    SortOrder,
} from "@modules/api"
import {
    createEnumType,
} from "@modules/common"

/** Sort fields for listing submission feedbacks. */
export enum SubmissionFeedbacksSortBy {
    OrderIndex = "orderIndex",
    Severity = "severity",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const GraphQLTypeSubmissionFeedbacksSortBy = createEnumType(SubmissionFeedbacksSortBy)

registerEnumType(GraphQLTypeSubmissionFeedbacksSortBy,
    {
        name: "SubmissionFeedbacksSortBy",
        description: "Sort field for listing submission feedbacks.",
        valuesMap: {
            [SubmissionFeedbacksSortBy.OrderIndex]: {
                description: "Sort by display order index",
            },
            [SubmissionFeedbacksSortBy.Severity]: {
                description: "Sort by severity",
            },
            [SubmissionFeedbacksSortBy.CreatedAt]: {
                description: "Sort by created at",
            },
            [SubmissionFeedbacksSortBy.UpdatedAt]: {
                description: "Sort by updated at",
            },
        },
    }
)

@InputType({
    description: "Sort field and order for listing submission feedbacks.",
})
export class SubmissionFeedbacksRequestSort extends SortInput<SubmissionFeedbacksSortBy> {
    @Field(
        () => GraphQLTypeSubmissionFeedbacksSortBy,
        {
            description: "Sort by",
        },
    )
        by: SubmissionFeedbacksSortBy
}

@InputType({
    description: "Pagination, sort, and filters for listing submission feedbacks.",
})
export class SubmissionFeedbacksRequestPaginationFilters extends PaginationPageFilters<SubmissionFeedbacksSortBy> {
    @Field(
        () => [SubmissionFeedbacksRequestSort],
        {
            defaultValue: [
                {
                    by: SubmissionFeedbacksSortBy.OrderIndex,
                    order: SortOrder.Asc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<SubmissionFeedbacksRequestSort>
}

@InputType({
    description: "Request for listing submission feedbacks with pagination.",
})
export class SubmissionFeedbacksRequest {
    @Field(
        () => ID,
        {
            description: "Submission attempt id; if provided, only feedbacks for this attempt are returned.",
            nullable: true,
        },
    )
        submissionAttemptId?: string

    @Field(
        () => SubmissionFeedbacksRequestPaginationFilters,
        {
            description: "Pagination and sort filters.",
        },
    )
        filters: SubmissionFeedbacksRequestPaginationFilters
}
