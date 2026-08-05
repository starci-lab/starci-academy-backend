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

/** Sort fields for listing module contents. */
export enum ContentsSortBy {
    /** Alphabetical by lesson title -- use when browsing, not curriculum order. */
    Title = "title",
    /** Authoring order within the module -- default so the syllabus order is preserved. */
    SortIndex = "sortIndex",
    /** Newest/oldest authored first -- useful for editorial review, not learner UX. */
    CreatedAt = "createdAt",
    /** Recently edited lessons float first -- editorial freshness, not syllabus order. */
    UpdatedAt = "updatedAt",
}

const GraphQLTypeContentsSortBy = createEnumType(ContentsSortBy)

registerEnumType(GraphQLTypeContentsSortBy,
    {
        name: "ContentsSortBy",
        description: "Sort field for listing module contents.",
        valuesMap: {
            [ContentsSortBy.Title]: {
                description: "Sort by title",
            },
            [ContentsSortBy.SortIndex]: {
                description: "Sort by display order within the module",
            },
            [ContentsSortBy.CreatedAt]: {
                description: "Sort by created at",
            },
            [ContentsSortBy.UpdatedAt]: {
                description: "Sort by updated at",
            },
        },
    }
)

@InputType({
    description: "Sort field and order for listing module contents.",
})
/**
 * One sort clause for the module contents list -- field + ASC/DESC; default
 * is SortIndex ASC so lessons follow authoring order.
 */
export class ContentsRequestSort extends SortInput<ContentsSortBy> {
    @Field(
        () => GraphQLTypeContentsSortBy,
        {
            description: "Sort by",
        },
    )
        by: ContentsSortBy
}

@InputType({
    description: "Pagination, sort, and module scope for listing contents.",
})
/**
 * Page size / offset / sorts for `contents`; scoped further by moduleId on
 * the parent request so ES never returns cross-module rows.
 */
export class ContentsRequestPaginationFilters extends PaginationPageFilters<ContentsSortBy> {
    @Field(
        () => [ContentsRequestSort],
        {
            defaultValue: [
                {
                    by: ContentsSortBy.SortIndex,
                    order: SortOrder.Asc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<ContentsRequestSort>
}

@InputType({
    description: "Request for listing contents in a module with pagination.",
})
/**
 * Args for `contents` -- module scope plus pagination; without moduleId the
 * ES filter would be empty and leak every indexed lesson.
 */
export class ContentsRequest {
    @Field(
        () => ID,
        {
            description: "Module id; only contents in this module are returned.",
        },
    )
        moduleId: string

    @Field(
        () => ContentsRequestPaginationFilters,
        {
            description: "Pagination and sort filters.",
        },
    )
        filters: ContentsRequestPaginationFilters
}
