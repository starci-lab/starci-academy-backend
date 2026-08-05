import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    isAbstract: true,
    description: "Response for page-based pagination.",
})
/** GraphQL type for page pagination response (count). */
export class PaginationPageResponseData {
    @Field(() => Int,
        {
            description: "The total number of items.",
        })
        count: number
}
