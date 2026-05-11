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

/** Sort fields for listing user personal task attempts. */
export enum UserPersonalTaskAttemptsSortBy {
    Score = "score",
    AttemptNumber = "attemptNumber",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
    ProcessedAt = "processedAt",
}

const GraphQLTypeUserPersonalTaskAttemptsSortBy = createEnumType(UserPersonalTaskAttemptsSortBy)

registerEnumType(GraphQLTypeUserPersonalTaskAttemptsSortBy,
    {
        name: "UserPersonalTaskAttemptsSortBy",
        description: "Sort field for listing user personal task attempts.",
        valuesMap: {
            [UserPersonalTaskAttemptsSortBy.Score]: {
                description: "Sort by score",
            },
            [UserPersonalTaskAttemptsSortBy.AttemptNumber]: {
                description: "Sort by attempt number",
            },
            [UserPersonalTaskAttemptsSortBy.CreatedAt]: {
                description: "Sort by created at",
            },
            [UserPersonalTaskAttemptsSortBy.UpdatedAt]: {
                description: "Sort by updated at",
            },
            [UserPersonalTaskAttemptsSortBy.ProcessedAt]: {
                description: "Sort by processed at",
            },
        },
    }
)

@InputType({
    description: "Sort field and order for listing user personal task attempts.",
})
export class UserPersonalTaskAttemptsRequestSort extends SortInput<UserPersonalTaskAttemptsSortBy> {
    @Field(
        () => GraphQLTypeUserPersonalTaskAttemptsSortBy,
        {
            description: "Sort by",
        },
    )
        by: UserPersonalTaskAttemptsSortBy
}

@InputType({
    description: "Pagination, sort, and filters for listing user personal task attempts.",
})
export class UserPersonalTaskAttemptsRequestPaginationFilters extends PaginationPageFilters<UserPersonalTaskAttemptsSortBy> {
    @Field(
        () => [UserPersonalTaskAttemptsRequestSort],
        {
            defaultValue: [
                {
                    by: UserPersonalTaskAttemptsSortBy.AttemptNumber,
                    order: SortOrder.Desc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<UserPersonalTaskAttemptsRequestSort>
}

@InputType({
    description: "Request for listing user personal task attempts with pagination.",
})
export class UserPersonalTaskAttemptsRequest {
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
            description: "Milestone task ID to fetch attempts for.",
        },
    )
        taskId: string

    @Field(
        () => UserPersonalTaskAttemptsRequestPaginationFilters,
        {
            description: "Pagination and sort filters.",
        },
    )
        filters: UserPersonalTaskAttemptsRequestPaginationFilters
}
