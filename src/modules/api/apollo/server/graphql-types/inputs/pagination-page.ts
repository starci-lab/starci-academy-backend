import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    SortInput 
} from "./sort"

/** GraphQL input for page-based pagination (pageNumber, limit). */
@InputType({
    isAbstract: true,
    description: "Input for page-based pagination (pageNumber, limit).",
})
export abstract class PaginationPageFilters<T extends string> {
    @Field(() => Int,
        {
            description: "Page number",
            nullable: true,
        })
        pageNumber?: number
    @Field(() => Int,
        {
            description: "Number of items to fetch per page",
            nullable: true,
        })
        limit?: number

    abstract sorts?: Array<SortInput<T>>
}