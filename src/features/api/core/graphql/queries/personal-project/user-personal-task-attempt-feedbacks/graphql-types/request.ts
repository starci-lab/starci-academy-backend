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
    OrderIndex = "orderIndex",
    Severity = "severity",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const GraphQLTypeUserPersonalTaskAttemptFeedbacksSortBy = createEnumType(UserPersonalTaskAttemptFeedbacksSortBy)

registerEnumType(GraphQLTypeUserPersonalTaskAttemptFeedbacksSortBy,
    {
        name: "UserPersonalTaskAttemptFeedbacksSortBy",
        description: "Sort field for listing user personal task attempt feedbacks.",
        valuesMap: {
            [UserPersonalTaskAttemptFeedbacksSortBy.OrderIndex]: {
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
export class UserPersonalTaskAttemptFeedbacksRequestPaginationFilters extends PaginationPageFilters<UserPersonalTaskAttemptFeedbacksSortBy> {
    @Field(
        () => [UserPersonalTaskAttemptFeedbacksRequestSort],
        {
            defaultValue: [
                {
                    by: UserPersonalTaskAttemptFeedbacksSortBy.OrderIndex,
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
