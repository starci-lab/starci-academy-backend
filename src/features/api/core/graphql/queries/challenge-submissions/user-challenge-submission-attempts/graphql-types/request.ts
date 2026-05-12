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

/** Sort fields for listing submission attempts. */
export enum UserChallengeSubmissionAttemptsSortBy {
    Score = "score",
    AttemptNumber = "attemptNumber",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
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
