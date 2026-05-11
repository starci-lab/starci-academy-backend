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
export enum UserChallengeSubmissionFeedbacksSortBy {
    OrderIndex = "orderIndex",
    Severity = "severity",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const GraphQLTypeUserChallengeSubmissionFeedbacksSortBy = createEnumType(UserChallengeSubmissionFeedbacksSortBy)

registerEnumType(GraphQLTypeUserChallengeSubmissionFeedbacksSortBy,
    {
        name: "UserChallengeSubmissionFeedbacksSortBy",
        description: "Sort field for listing submission feedbacks.",
        valuesMap: {
            [UserChallengeSubmissionFeedbacksSortBy.OrderIndex]: {
                description: "Sort by display order index",
            },
            [UserChallengeSubmissionFeedbacksSortBy.Severity]: {
                description: "Sort by severity",
            },
            [UserChallengeSubmissionFeedbacksSortBy.CreatedAt]: {
                description: "Sort by created at",
            },
            [UserChallengeSubmissionFeedbacksSortBy.UpdatedAt]: {
                description: "Sort by updated at",
            },
        },
    }
)

@InputType({
    description: "Sort field and order for listing submission feedbacks.",
})
export class UserChallengeSubmissionFeedbacksRequestSort extends SortInput<UserChallengeSubmissionFeedbacksSortBy> {
    @Field(
        () => GraphQLTypeUserChallengeSubmissionFeedbacksSortBy,
        {
            description: "Sort by",
        },
    )
        by: UserChallengeSubmissionFeedbacksSortBy
}

@InputType({
    description: "Pagination, sort, and filters for listing submission feedbacks.",
})
export class UserChallengeSubmissionFeedbacksRequestPaginationFilters extends PaginationPageFilters<UserChallengeSubmissionFeedbacksSortBy> {
    @Field(
        () => [UserChallengeSubmissionFeedbacksRequestSort],
        {
            defaultValue: [
                {
                    by: UserChallengeSubmissionFeedbacksSortBy.OrderIndex,
                    order: SortOrder.Asc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<UserChallengeSubmissionFeedbacksRequestSort>
}

@InputType({
    description: "Request for listing submission feedbacks with pagination.",
})
export class UserChallengeSubmissionFeedbacksRequest {
    @Field(
        () => ID,
        {
            description: "Submission attempt id; if provided, only feedbacks for this attempt are returned.",
            nullable: true,
        },
    )
        submissionAttemptId?: string

    @Field(
        () => UserChallengeSubmissionFeedbacksRequestPaginationFilters,
        {
            description: "Pagination and sort filters.",
        },
    )
        filters: UserChallengeSubmissionFeedbacksRequestPaginationFilters
}
