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

/** Sort fields for listing submission attempts. */
export enum UserChallengeSubmissionAttemptsSortBy {
    /** Highest/lowest graded score first -- pick a "best attempt" without scanning dates. */
    Score = "score",
    /** Attempt sequence (1, 2, 3...) -- Asc is chronological try order. */
    AttemptNumber = "attemptNumber",
    /** Default (Desc): newest attempts first on the history list. */
    CreatedAt = "createdAt",
    /** Recently edited attempt rows first when Desc. */
    UpdatedAt = "updatedAt",
    /** When scoring finished -- pending attempts sort apart from graded ones. */
    ProcessedAt = "processedAt",
}

const GraphQLTypeUserChallengeSubmissionAttemptsSortBy = createEnumType(UserChallengeSubmissionAttemptsSortBy)

registerEnumType(GraphQLTypeUserChallengeSubmissionAttemptsSortBy,
    {
        name: "UserChallengeSubmissionAttemptsSortBy",
        description: "Sort field for listing submission attempts.",
        valuesMap: {
            [UserChallengeSubmissionAttemptsSortBy.Score]: {
                description: "Sort by score",
            },
            [UserChallengeSubmissionAttemptsSortBy.AttemptNumber]: {
                description: "Sort by attempt number",
            },
            [UserChallengeSubmissionAttemptsSortBy.CreatedAt]: {
                description: "Sort by created at",
            },
            [UserChallengeSubmissionAttemptsSortBy.UpdatedAt]: {
                description: "Sort by updated at",
            },
            [UserChallengeSubmissionAttemptsSortBy.ProcessedAt]: {
                description: "Sort by processed at",
            },
        },
    }
)

@InputType({
    description: "Sort field and order for listing submission attempts.",
})
/**
 * One sort key for the caller's attempt history. Default on the filters is
 * CreatedAt Desc (newest try first).
 */
export class UserChallengeSubmissionAttemptsRequestSort extends SortInput<UserChallengeSubmissionAttemptsSortBy> {
    @Field(
        () => GraphQLTypeUserChallengeSubmissionAttemptsSortBy,
        {
            description: "Sort by",
        },
    )
        by: UserChallengeSubmissionAttemptsSortBy
}

@InputType({
    description: "Pagination, sort, and filters for listing submission attempts.",
})
/**
 * Page + sort for `userChallengeSubmissionAttempts`. Missing page/limit use
 * the API pagination defaults. An empty join row yields `{ data: [], count: 0 }`
 * rather than an error.
 */
export class UserChallengeSubmissionAttemptsRequestPaginationFilters extends PaginationPageFilters<UserChallengeSubmissionAttemptsSortBy> {
    @Field(
        () => [UserChallengeSubmissionAttemptsRequestSort],
        {
            defaultValue: [
                {
                    by: UserChallengeSubmissionAttemptsSortBy.CreatedAt,
                    order: SortOrder.Desc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<UserChallengeSubmissionAttemptsRequestSort>
}

@InputType({
    description: "Request for listing submission attempts with pagination.",
})
/**
 * Paginated attempt history for the signed-in user on one challenge
 * submission. Attempts belonging to other users are never returned.
 */
export class UserChallengeSubmissionAttemptsRequest {
    @Field(
        () => ID,
        {
            description: "Challenge submission id; if provided, only attempts for this submission are returned.",
        },
    )
        challengeSubmissionId: string

    @Field(
        () => UserChallengeSubmissionAttemptsRequestPaginationFilters,
        {
            description: "Pagination and sort filters.",
        },
    )
        filters: UserChallengeSubmissionAttemptsRequestPaginationFilters
}
