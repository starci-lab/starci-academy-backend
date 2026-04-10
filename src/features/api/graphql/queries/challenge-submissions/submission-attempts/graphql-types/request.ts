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
export enum SubmissionAttemptsSortBy {
    Score = "score",
    AttemptNumber = "attemptNumber",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
    ProcessedAt = "processedAt",
}

const GraphQLTypeSubmissionAttemptsSortBy = createEnumType(SubmissionAttemptsSortBy)

registerEnumType(GraphQLTypeSubmissionAttemptsSortBy,
    {
        name: "SubmissionAttemptsSortBy",
        description: "Sort field for listing submission attempts.",
        valuesMap: {
            [SubmissionAttemptsSortBy.Score]: {
                description: "Sort by score",
            },
            [SubmissionAttemptsSortBy.AttemptNumber]: {
                description: "Sort by attempt number",
            },
            [SubmissionAttemptsSortBy.CreatedAt]: {
                description: "Sort by created at",
            },
            [SubmissionAttemptsSortBy.UpdatedAt]: {
                description: "Sort by updated at",
            },
            [SubmissionAttemptsSortBy.ProcessedAt]: {
                description: "Sort by processed at",
            },
        },
    }
)

@InputType({
    description: "Sort field and order for listing submission attempts.",
})
export class SubmissionAttemptsRequestSort extends SortInput<SubmissionAttemptsSortBy> {
    @Field(
        () => GraphQLTypeSubmissionAttemptsSortBy,
        {
            description: "Sort by",
        },
    )
        by: SubmissionAttemptsSortBy
}

@InputType({
    description: "Pagination, sort, and filters for listing submission attempts.",
})
export class SubmissionAttemptsRequestPaginationFilters extends PaginationPageFilters<SubmissionAttemptsSortBy> {
    @Field(
        () => [SubmissionAttemptsRequestSort],
        {
            defaultValue: [
                {
                    by: SubmissionAttemptsSortBy.CreatedAt,
                    order: SortOrder.Desc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<SubmissionAttemptsRequestSort>
}

@InputType({
    description: "Request for listing submission attempts with pagination.",
})
export class SubmissionAttemptsRequest {
    @Field(
        () => ID,
        {
            description: "User challenge submission id; if provided, only attempts for this submission are returned.",
            nullable: true,
        },
    )
        userChallengeSubmissionId?: string

    @Field(
        () => SubmissionAttemptsRequestPaginationFilters,
        {
            description: "Pagination and sort filters.",
        },
    )
        filters: SubmissionAttemptsRequestPaginationFilters
}
