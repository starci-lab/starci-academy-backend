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
    /** Best/worst graded runs float first — score leaderboard within one task. */
    Score = "score",
    /** Submission sequence — default DESC so the latest attempt is first. */
    AttemptNumber = "attemptNumber",
    /** When the attempt row was created — wall-clock history, not attemptNumber. */
    CreatedAt = "createdAt",
    /** Last mutation time — surfaces in-progress updates ahead of stale rows. */
    UpdatedAt = "updatedAt",
    /** When AI grading finished — unfinished attempts sort last / nulls last depending on DB. */
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
/**
 * One sort clause for the caller's personal-task attempt history.
 */
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
/**
 * Page / sort filters for `userPersonalTaskAttempts` (default AttemptNumber DESC).
 */
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
/**
 * Args for `userPersonalTaskAttempts` — course + task bound to the caller's
 * enrollment; missing enrollment returns an empty page.
 */
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
