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

/** Sort fields for listing module contents. */
export enum ContentsSortBy {
    Title = "title",
    OrderIndex = "orderIndex",
    CreatedAt = "createdAt",
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
            [ContentsSortBy.OrderIndex]: {
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
export class ContentsRequestPaginationFilters extends PaginationPageFilters<ContentsSortBy> {
    @Field(
        () => ID,
        {
            description: "Parent module id; only contents in this module are returned.",
        },
    )
        moduleId: string

    @Field(
        () => [ContentsRequestSort],
        {
            defaultValue: [
                {
                    by: ContentsSortBy.OrderIndex,
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
export class ContentsRequest {
    @Field(
        () => ContentsRequestPaginationFilters,
        {
            description: "Pagination and sort filters.",
        },
    )
        filters: ContentsRequestPaginationFilters
}
