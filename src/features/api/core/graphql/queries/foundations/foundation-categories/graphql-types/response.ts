import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    FoundationCategoryEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-category.entity"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "A page of foundation categories plus the total match count.",
})
/**
 * Paginated page of foundation categories.
 */
export class FoundationCategoriesPayload {
    /** Total number of categories matching the search (across all pages). */
    @Field(
        () => Int,
        {
            description: "Total matching categories across all pages.",
        },
    )
        totalCount: number

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
/** Categories for the requested page, ordered by display index. */
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
