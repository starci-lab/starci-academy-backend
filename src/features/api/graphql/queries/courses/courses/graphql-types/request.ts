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


/** Sort by. */
export enum SortBy {
    Title = "title",
    CreatedAt = "createdAt",
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



/** Sort line in a courses list request. */
@InputType({
    description: "Sort field and order for listing courses.",
})
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



/** Request for the courses GraphQL query. */

@InputType({
    description: "Request for listing courses with pagination.",
})
export class CoursesRequest {
    @Field(() => CoursesRequestPaginationFilters,
        {
            description: "Pagination and sort filters.",
        })
        filters: CoursesRequestPaginationFilters
}


