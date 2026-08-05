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

/** Sort fields for listing foundations within a category. */
export enum FoundationsSortBy {
    /** Orders foundations alphabetically by title. */
    Title = "title",
    /** Orders foundations by curated display order within the category. */
    SortIndex = "sortIndex",
    /** Orders foundations by when the row was created. */
    CreatedAt = "createdAt",
    /** Orders foundations by when the row was last modified. */
    UpdatedAt = "updatedAt",
}

const GraphQLTypeFoundationsSortBy = createEnumType(FoundationsSortBy)

registerEnumType(
    GraphQLTypeFoundationsSortBy,
    {
        name: "FoundationsSortBy",
        description: "Sort field for listing foundations within a category.",
        valuesMap: {
            [FoundationsSortBy.Title]: {
                description: "Sort by title",
            },
            [FoundationsSortBy.SortIndex]: {
                description: "Sort by display order within the category",
            },
            [FoundationsSortBy.CreatedAt]: {
                description: "Sort by created at",
            },
            [FoundationsSortBy.UpdatedAt]: {
                description: "Sort by updated at",
            },
        },
    },
)

@InputType({
    description: "Sort field and order for listing foundations within a category.",
})
/** One sort line (field + order) for a foundations list request. */
export class FoundationsRequestSort extends SortInput<FoundationsSortBy> {
    @Field(
        () => GraphQLTypeFoundationsSortBy,
        {
            description: "Sort by",
        },
    )
        by: FoundationsSortBy
}

@InputType({
    description: "Pagination and sort filters for listing foundations.",
})
/**
 * Page size, page number, and sort lines for foundations inside one category
 * (defaults to ascending `sortIndex`).
 */
export class FoundationsFilters extends PaginationPageFilters<FoundationsSortBy> {
    @Field(
        () => [FoundationsRequestSort],
        {
            defaultValue: [
                {
                    by: FoundationsSortBy.SortIndex,
                    order: SortOrder.Asc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<FoundationsRequestSort>
}

@InputType({
    description: "Foundations request parameters.",
})
/**
 * Foundations request.
 */
export class FoundationsRequest {
    /**
     * Category ID.
     */
    @Field(
        () => ID,
        {
            description: "ID of the foundation category.",
        },
    )
        categoryId: string

    /**
     * Optional filters including pagination.
     */
    @Field(
        () => FoundationsFilters,
        {
            description: "Filters including pagination.",
            nullable: true,
            defaultValue: {
                sorts: [
                    {
                        by: FoundationsSortBy.SortIndex,
                        order: SortOrder.Asc,
                    },
                ],
            },
        },
    )
        filters?: FoundationsFilters
}
