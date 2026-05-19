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
    Title = "title",
    OrderIndex = "orderIndex",
    CreatedAt = "createdAt",
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
            [FoundationsSortBy.OrderIndex]: {
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
export class FoundationsFilters extends PaginationPageFilters<FoundationsSortBy> {
    @Field(
        () => [FoundationsRequestSort],
        {
            defaultValue: [
                {
                    by: FoundationsSortBy.OrderIndex,
                    order: SortOrder.Asc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<FoundationsRequestSort>
}

/**
 * Foundations request.
 */
@InputType({
    description: "Foundations request parameters.",
})
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
                        by: FoundationsSortBy.OrderIndex,
                        order: SortOrder.Asc,
                    },
                ],
            },
        },
    )
        filters?: FoundationsFilters
}
