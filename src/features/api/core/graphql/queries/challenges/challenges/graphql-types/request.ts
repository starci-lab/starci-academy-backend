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
    /** Alphabetical by title in the locale ES index -- not curriculum order. */
    Title = "title",
    /** Default (Asc): display order within the content item. */
    SortIndex = "sortIndex",
    /** Chronological by challenge creation. */
    CreatedAt = "createdAt",
    /** Recently edited challenges first when Desc. */
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
/**
 * One ES sort key for the content-scoped challenge list. Default on the
 * filters is SortIndex Asc (curriculum order).
 */
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
/**
 * Page + sort for `challenges`. The handler searches Elasticsearch (locale
 * index), not Postgres -- missing page/limit use API pagination defaults.
 */
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
/**
 * Paginated challenges belonging to one content item (`contentId` is a
 * keyword term on the ES index). Title/description are searchable via the
 * shared ES query builder.
 */
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
