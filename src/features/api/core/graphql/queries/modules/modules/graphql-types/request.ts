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

export enum ModulesSortBy {
    Title = "title",
    OrderIndex = "orderIndex",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const GraphQLTypeModulesSortBy = createEnumType(ModulesSortBy)

registerEnumType(GraphQLTypeModulesSortBy,
    {
        name: "ModulesSortBy",
        description: "Sort field for listing modules within a course.",
        valuesMap: {
            [ModulesSortBy.Title]: {
                description: "Sort by title",
            },
            [ModulesSortBy.OrderIndex]: {
                description: "Sort by display order within the course",
            },
            [ModulesSortBy.CreatedAt]: {
                description: "Sort by created at",
            },
            [ModulesSortBy.UpdatedAt]: {
                description: "Sort by updated at",
            },
        },
    })

@InputType({
    description: "Sort field and order for listing modules within a course.",
})
export class ModulesRequestSort extends SortInput<ModulesSortBy> {
    @Field(
        () => GraphQLTypeModulesSortBy,
        {
            description: "Sort by",
        },
    )
        by: ModulesSortBy
}

@InputType({
    description: "Pagination, sort, and course scope for listing modules.",
})
export class ModulesRequestPaginationFilters extends PaginationPageFilters<ModulesSortBy> {
    @Field(
        () => [ModulesRequestSort],
        {
            defaultValue: [
                {
                    by: ModulesSortBy.OrderIndex,
                    order: SortOrder.Asc,
                },
            ],
            description: "Sorts",
        },
    )
        sorts: Array<ModulesRequestSort>
}

@InputType({
    description: "Request for listing modules in a course with pagination.",
})
export class ModulesRequest {
    @Field(
        () => ID,
        {
            description: "Course id; only modules in this course are returned.",
        },
    )
        courseId: string

    @Field(
        () => ModulesRequestPaginationFilters,
        {
            description: "Pagination and sort filters.",
        },
    )
        filters: ModulesRequestPaginationFilters
}
