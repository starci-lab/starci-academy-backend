import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    FoundationCategoryEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * Paginated page of foundation categories.
 */
@ObjectType({
    description: "A page of foundation categories plus the total match count.",
})
export class FoundationCategoriesPayload {
    /** Total number of categories matching the search (across all pages). */
    @Field(
        () => Int,
        {
            description: "Total matching categories across all pages.",
        },
    )
        totalCount: number

    /** Categories for the requested page, ordered by display index. */
    @Field(
        () => [FoundationCategoryEntity],
        {
            description: "Categories for this page, ordered by display index.",
        },
    )
        data: Array<FoundationCategoryEntity>
}

@ObjectType({
    description: "Response wrapper for the foundationCategories query.",
})
export class FoundationCategoriesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<FoundationCategoriesPayload>
{
    @Field(
        () => FoundationCategoriesPayload,
        {
            nullable: true,
            description: "Paginated foundation categories.",
        },
    )
        data: FoundationCategoriesPayload
}
