import {
    Field,
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

/** Sort fields for listing CV submission attempts. */
export enum UserCvSubmissionAttemptsSortBy {
    CreatedAt = "createdAt",
}

const GraphQLTypeUserCvSubmissionAttemptsSortBy = createEnumType(UserCvSubmissionAttemptsSortBy)

registerEnumType(
    GraphQLTypeUserCvSubmissionAttemptsSortBy,
    {
        name: "UserCvSubmissionAttemptsSortBy",
        description: "Sort field for listing CV submission attempts.",
        valuesMap: {
            [UserCvSubmissionAttemptsSortBy.CreatedAt]: {
                description: "Sort by attempt created at",
            },
        },
    },
)

@InputType({
    description: "Sort field and order for listing CV submission attempts.",
})
export class UserCvSubmissionAttemptsRequestSort extends SortInput<UserCvSubmissionAttemptsSortBy> {
    @Field(
        () => GraphQLTypeUserCvSubmissionAttemptsSortBy,
        {
            description: "Sort by",
        },
    )
        by: UserCvSubmissionAttemptsSortBy
}

@InputType({
    description: "Pagination and sort for listing CV submission attempts.",
})
export class UserCvSubmissionAttemptsRequestPaginationFilters extends PaginationPageFilters<UserCvSubmissionAttemptsSortBy> {
    @Field(
        () => [UserCvSubmissionAttemptsRequestSort],
        {
            defaultValue: [
                {
                    by: UserCvSubmissionAttemptsSortBy.CreatedAt,
                    order: SortOrder.Desc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<UserCvSubmissionAttemptsRequestSort>
}

@InputType({
    description: "Request for paginated CV submission attempts for the current user.",
})
export class UserCvSubmissionAttemptsRequest {
    @Field(
        () => UserCvSubmissionAttemptsRequestPaginationFilters,
        {
            nullable: true,
            description: "Pagination and sort filters.",
        },
    )
        filters?: UserCvSubmissionAttemptsRequestPaginationFilters
}
