import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

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
