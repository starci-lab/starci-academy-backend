import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    FoundationCategoryEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response wrapper for the foundationCategories query.",
})
export class FoundationCategoriesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<FoundationCategoryEntity>>
{
    @Field(
        () => [FoundationCategoryEntity],
        {
            description: "Foundation categories ordered by display index.",
        },
    )
        data: Array<FoundationCategoryEntity>
}
