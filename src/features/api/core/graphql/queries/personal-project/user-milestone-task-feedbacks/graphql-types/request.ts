import {
    Field,
    ID,
    InputType,
    registerEnumType,
} from "@nestjs/graphql"
import {
    PaginationPageFilters,
} from "@modules/api/apollo/server/graphql-types/inputs/pagination-page"
import {
    SortInput,
    SortOrder,
} from "@modules/api/apollo/server/graphql-types/inputs/sort"
import {
    createEnumType,
} from "@modules/lib/common/utils/enum"

/** Sort fields for listing feedback rows on the latest milestone-task attempt. */
export enum UserMilestoneTaskFeedbacksSortBy {
    /** Authoring / AI display order -- default so feedback reads top-to-bottom as written. */
    SortIndex = "sortIndex",
    /** Cluster critical issues first -- triage view, not narrative reading order. */
    Severity = "severity",
    /** When the feedback row was written -- chronological audit, not display order. */
    CreatedAt = "createdAt",
    /** Last edit time -- surfaces revised feedback ahead of untouched rows. */
    UpdatedAt = "updatedAt",
}

const GraphQLTypeUserMilestoneTaskFeedbacksSortBy = createEnumType(UserMilestoneTaskFeedbacksSortBy)

registerEnumType(
    GraphQLTypeUserMilestoneTaskFeedbacksSortBy,
    {
        name: "UserMilestoneTaskFeedbacksSortBy",
        description: "Sort field for userMilestoneTaskFeedbacks.",
        valuesMap: {
            [UserMilestoneTaskFeedbacksSortBy.SortIndex]: {
                description: "Sort by display order index",
            },
            [UserMilestoneTaskFeedbacksSortBy.Severity]: {
                description: "Sort by severity",
            },
            [UserMilestoneTaskFeedbacksSortBy.CreatedAt]: {
                description: "Sort by created at",
            },
            [UserMilestoneTaskFeedbacksSortBy.UpdatedAt]: {
                description: "Sort by updated at",
            },
        },
    },
)

@InputType({
    description: "Sort field and order for userMilestoneTaskFeedbacks.",
})
/**
 * One sort clause for feedback on the caller's latest milestone-task attempt.
 */
export class UserMilestoneTaskFeedbacksRequestSort extends SortInput<UserMilestoneTaskFeedbacksSortBy> {
    @Field(
        () => GraphQLTypeUserMilestoneTaskFeedbacksSortBy,
        {
            description: "Sort by",
        },
    )
        by: UserMilestoneTaskFeedbacksSortBy
}

@InputType({
    description: "Pagination and sort filters for userMilestoneTaskFeedbacks.",
})
/**
 * Page / sort filters for `userMilestoneTaskFeedbacks` (default SortIndex ASC).
 */
export class UserMilestoneTaskFeedbacksRequestPaginationFilters extends PaginationPageFilters<UserMilestoneTaskFeedbacksSortBy> {
    @Field(
        () => [UserMilestoneTaskFeedbacksRequestSort],
        {
            defaultValue: [
                {
                    by: UserMilestoneTaskFeedbacksSortBy.SortIndex,
                    order: SortOrder.Asc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<UserMilestoneTaskFeedbacksRequestSort>
}

@InputType({
    description: "Request for feedback items on the caller’s latest attempt for a milestone task.",
})
/**
 * Args for `userMilestoneTaskFeedbacks` -- course + task identify the caller's
 * latest attempt whose feedback rows are listed (no attemptId needed).
 */
export class UserMilestoneTaskFeedbacksRequest {
    @Field(
        () => ID,
        {
            description: "Course ID.",
        },
    )
        courseId: string

    @Field(
        () => ID,
        {
            description: "Milestone task ID.",
        },
    )
        taskId: string

    @Field(
        () => UserMilestoneTaskFeedbacksRequestPaginationFilters,
        {
            description: "Pagination and sort filters.",
        },
    )
        filters: UserMilestoneTaskFeedbacksRequestPaginationFilters
}
