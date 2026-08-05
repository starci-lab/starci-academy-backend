import {
    Field,
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


/** Sort fields for listing courses. */
export enum SortBy {
    /** Orders the list alphabetically by course title. */
    Title = "title",
    /** Orders the list by when the course was created. */
    CreatedAt = "createdAt",
    /** Orders the list by when the course was last modified. */
    UpdatedAt = "updatedAt",
}

/** GraphQL type for sort by. */
const GraphQLTypeSortBy = createEnumType(SortBy)

/** Register sort by enum type. */
registerEnumType(GraphQLTypeSortBy,
    {
        name: "SortBy",
        description: "Sort by",
        valuesMap: {
            [SortBy.Title]: {
                description: "Sort by title",
            },
            [SortBy.CreatedAt]: {
                description: "Sort by created at",
            },
            [SortBy.UpdatedAt]: {
                description: "Sort by updated at",
            },
        },
    }
)



@InputType({
    description: "Sort field and order for listing courses.",
})
/** Sort line in a courses list request. */
export class CoursesRequestSort extends SortInput<SortBy> {
    /** Sort by. */
    @Field(
        () => GraphQLTypeSortBy,
        {
            description: "Sort by",
        }
    )
        by: SortBy
}

/** Pagination and sort filters for the courses query. */
@InputType({
    description: "Pagination and sort options for listing courses.",
})
/** Pagination and sort filters for the courses query. */
export class CoursesRequestPaginationFilters extends PaginationPageFilters<SortBy> {
    /** Sorts. */
    @Field(() => [CoursesRequestSort],
        {
            defaultValue: [
                {
                    by: SortBy.Title,
                    order: SortOrder.Asc,
                }
            ],
            description: "Sorts",
        })
        sorts: Array<CoursesRequestSort>
}



@InputType({
    description: "Request for listing courses with pagination.",
})
/** Request for the courses GraphQL query. */
export class CoursesRequest {
    @Field(() => CoursesRequestPaginationFilters,
        {
            description: "Pagination and sort filters.",
        })
        filters: CoursesRequestPaginationFilters
}


