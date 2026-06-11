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
    SortIndex = "sortIndex",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const GraphQLTypeChallengesSortBy = createEnumType(ChallengesSortBy)

registerEnumType(GraphQLTypeChallengesSortBy,
    {
        name: "ChallengesSortBy",
        description: "Sort field for listing challenges within a content item.",
        valuesMap: {
            [ChallengesSortBy.Title]: {
                description: "Sort by title",
            },
            [ChallengesSortBy.SortIndex]: {
                description: "Sort by display order within the content",
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
    description: "Sort field and order for listing challenges within a content item.",
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
    description: "Pagination, sort, and content scope for listing challenges.",
})
export class ChallengesRequestPaginationFilters extends PaginationPageFilters<ChallengesSortBy> {
    @Field(
        () => [ChallengesRequestSort],
        {
            defaultValue: [
                {
                    by: ChallengesSortBy.SortIndex,
                    order: SortOrder.Asc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<ChallengesRequestSort>
}

@InputType({
    description: "Request for listing challenges in a content item with pagination.",
})
export class ChallengesRequest {
    @Field(
        () => ID,
        {
            description: "Content id; only challenges associated with this content is returned.",
        },
    )
        contentId: string

    @Field(
        () => ChallengesRequestPaginationFilters,
        {
            description: "Pagination and sort filters.",
        },
    )
        filters: ChallengesRequestPaginationFilters
}
