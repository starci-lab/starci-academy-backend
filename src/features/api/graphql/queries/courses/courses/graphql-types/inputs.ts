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
    createEnumType 
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

/** Input for sort. */
@InputType({
    description: "Input for sort.",
})
export class CoursesSortInput extends SortInput<SortBy>{
    /** Sort by. */
    @Field(
        () => GraphQLTypeSortBy,
        {
            description: "Sort by",
        }
    )
        by: SortBy
}

/** Pagination filters for the courses query. */
@InputType({
    description: "Pagination and sort options for listing courses.",
})
export class CoursesPaginationFilters extends PaginationPageFilters<SortBy> {
    @Field(() => [CoursesSortInput],
        {
            defaultValue: [
                {
                    by: SortBy.Title,
                    order: SortOrder.Asc,
                }
            ],
            description: "Sorts",
        })
        sorts: Array<CoursesSortInput>
}

/** Input for the courses GraphQL query. */
@InputType({
    description: "Request input for listing courses.",
})
export class CoursesInput {
    @Field(() => CoursesPaginationFilters,
        {
            description: "Pagination and sort filters.",
        })
        filters: CoursesPaginationFilters
}
