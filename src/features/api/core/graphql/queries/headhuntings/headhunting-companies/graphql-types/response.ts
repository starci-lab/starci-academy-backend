import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    HeadhuntingCompanyEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Response wrapper for the headhuntingCompanies query.",
})
/** Response wrapper for the headhunting companies list query. */
export class HeadhuntingCompaniesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<HeadhuntingCompanyEntity>>
{
    @Field(
        () => [HeadhuntingCompanyEntity],
        {
            description: "Headhunting companies ordered by display index.",
        },
    )
        data: Array<HeadhuntingCompanyEntity>
}
