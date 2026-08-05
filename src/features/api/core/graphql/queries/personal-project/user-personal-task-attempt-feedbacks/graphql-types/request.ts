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

/** Sort fields for listing user personal task attempt feedbacks. */
export enum UserPersonalTaskAttemptFeedbacksSortBy {
    /** Authoring / AI display order -- default so feedback reads top-to-bottom as written. */
    SortIndex = "sortIndex",
    /** Cluster critical issues first -- triage view, not narrative reading order. */
    Severity = "severity",
    /** When the feedback row was written -- chronological audit, not display order. */
    CreatedAt = "createdAt",
    /** Last edit time -- surfaces revised feedback ahead of untouched rows. */
    UpdatedAt = "updatedAt",
}

const GraphQLTypeUserPersonalTaskAttemptFeedbacksSortBy = createEnumType(UserPersonalTaskAttemptFeedbacksSortBy)

registerEnumType(GraphQLTypeUserPersonalTaskAttemptFeedbacksSortBy,
    {
        name: "UserPersonalTaskAttemptFeedbacksSortBy",
        description: "Sort field for listing user personal task attempt feedbacks.",
        valuesMap: {
            [UserPersonalTaskAttemptFeedbacksSortBy.SortIndex]: {
                description: "Sort by display order index",
            },
            [UserPersonalTaskAttemptFeedbacksSortBy.Severity]: {
                description: "Sort by severity",
            },
            [UserPersonalTaskAttemptFeedbacksSortBy.CreatedAt]: {
                description: "Sort by created at",
            },
            [UserPersonalTaskAttemptFeedbacksSortBy.UpdatedAt]: {
                description: "Sort by updated at",
            },
        },
    }
)

@InputType({
    description: "Sort field and order for listing user personal task attempt feedbacks.",
})
/**
 * One sort clause for feedback rows on a specific personal-task attempt.
 */
export class UserPersonalTaskAttemptFeedbacksRequestSort extends SortInput<UserPersonalTaskAttemptFeedbacksSortBy> {
    @Field(
        () => GraphQLTypeUserPersonalTaskAttemptFeedbacksSortBy,
        {
            description: "Sort by",
        },
    )
        by: UserPersonalTaskAttemptFeedbacksSortBy
}

@InputType({
    description: "Pagination, sort, and filters for listing user personal task attempt feedbacks.",
})
/**
 * Page / sort filters for `userPersonalTaskAttemptFeedbacks` (default SortIndex ASC).
 */
export class UserPersonalTaskAttemptFeedbacksRequestPaginationFilters extends PaginationPageFilters<UserPersonalTaskAttemptFeedbacksSortBy> {
    @Field(
        () => [UserPersonalTaskAttemptFeedbacksRequestSort],
        {
            defaultValue: [
                {
                    by: UserPersonalTaskAttemptFeedbacksSortBy.SortIndex,
                    order: SortOrder.Asc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<UserPersonalTaskAttemptFeedbacksRequestSort>
}

@InputType({
    description: "Request for listing user personal task attempt feedbacks with pagination.",
})
/**
 * Args for `userPersonalTaskAttemptFeedbacks` -- attemptId scopes feedback to
 * one review run (unlike the latest-attempt helper on the sibling query).
 */
export class UserPersonalTaskAttemptFeedbacksRequest {
    @Field(
        () => ID,
        {
            description: "Attempt ID to fetch feedbacks for.",
        },
    )
        attemptId: string

    @Field(
        () => UserPersonalTaskAttemptFeedbacksRequestPaginationFilters,
        {
            description: "Pagination and sort filters.",
        },
    )
        filters: UserPersonalTaskAttemptFeedbacksRequestPaginationFilters
}
