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

/** Sort fields for listing module challenges. */
export enum ChallengesSortBy {
    Title = "title",
    OrderIndex = "orderIndex",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const GraphQLTypeChallengesSortBy = createEnumType(ChallengesSortBy)

registerEnumType(GraphQLTypeChallengesSortBy,
    {
        name: "ChallengesSortBy",
        description: "Sort field for listing module challenges.",
        valuesMap: {
            [ChallengesSortBy.Title]: {
                description: "Sort by title",
            },
            [ChallengesSortBy.OrderIndex]: {
                description: "Sort by display order within the module",
            },
            [ChallengesSortBy.CreatedAt]: {
                description: "Sort by created at",
            },
            [ChallengesSortBy.UpdatedAt]: {
                description: "Sort by updated at",
            },
        },
    }
)

@InputType({
    description: "Sort field and order for listing module challenges.",
})
export class ChallengesRequestSort extends SortInput<ChallengesSortBy> {
    @Field(
        () => GraphQLTypeChallengesSortBy,
        {
            description: "Sort by",
        },
    )
        by: ChallengesSortBy
}

@InputType({
    description: "Pagination, sort, and module scope for listing challenges.",
})
export class ChallengesRequestPaginationFilters extends PaginationPageFilters<ChallengesSortBy> {
    @Field(
        () => ID,
        {
            description: "Parent module id; only challenges in this module are returned.",
        },
    )
        moduleId: string

    @Field(
        () => [ChallengesRequestSort],
        {
            defaultValue: [
                {
                    by: ChallengesSortBy.OrderIndex,
                    order: SortOrder.Asc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<ChallengesRequestSort>
}

@InputType({
    description: "Request for listing challenges in a module with pagination.",
})
export class ChallengesRequest {
    @Field(
        () => ChallengesRequestPaginationFilters,
        {
            description: "Pagination and sort filters.",
        },
    )
        filters: ChallengesRequestPaginationFilters
}
