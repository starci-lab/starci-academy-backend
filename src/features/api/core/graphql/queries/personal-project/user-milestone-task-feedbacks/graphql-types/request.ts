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

/** Sort fields for listing feedback rows on the latest milestone-task attempt. */
export enum UserMilestoneTaskFeedbacksSortBy {
    SortIndex = "sortIndex",
    Severity = "severity",
    CreatedAt = "createdAt",
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
