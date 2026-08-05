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
    /** Default (Asc): scorer-written display order — reading order on the attempt. */
    SortIndex = "sortIndex",
    /** Groups by severity so critical items can surface before nits. */
    Severity = "severity",
    /** Chronological write time of each feedback item. */
    CreatedAt = "createdAt",
    /** Recently edited feedback first when Desc. */
    UpdatedAt = "updatedAt",
}

const GraphQLTypeUserChallengeSubmissionFeedbacksSortBy = createEnumType(UserChallengeSubmissionFeedbacksSortBy)

registerEnumType(GraphQLTypeUserChallengeSubmissionFeedbacksSortBy,
    {
        name: "UserChallengeSubmissionFeedbacksSortBy",
        description: "Sort field for listing submission feedbacks.",
        valuesMap: {
            [UserChallengeSubmissionFeedbacksSortBy.SortIndex]: {
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
/**
 * One sort key for attempt feedback. Default on the filters is SortIndex Asc
 * (scorer display order).
 */
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
/**
 * Page + sort for `userChallengeSubmissionFeedbacks`. Missing page/limit use
 * the API pagination defaults.
 */
export class UserChallengeSubmissionFeedbacksRequestPaginationFilters extends PaginationPageFilters<UserChallengeSubmissionFeedbacksSortBy> {
    @Field(
        () => [UserChallengeSubmissionFeedbacksRequestSort],
        {
            defaultValue: [
                {
                    by: UserChallengeSubmissionFeedbacksSortBy.SortIndex,
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
/**
 * Paginated scorer feedback for one submission attempt. `submissionAttemptId`
 * is optional on the input type but the handler filters by it — omit it and
 * the where-clause matches a null attempt id (empty page).
 */
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
