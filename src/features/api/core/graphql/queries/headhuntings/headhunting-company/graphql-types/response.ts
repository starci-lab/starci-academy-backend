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
    description: "Response wrapper for the Headhunter query.",
})
/** Response wrapper for the single headhunting company query. */
export class HeadhuntingCompanyResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<HeadhuntingCompanyEntity>
{
    @Field(
        () => HeadhuntingCompanyEntity,
        {
            nullable: true,
            description: "headhunter payload.",
        },
    )
        data: HeadhuntingCompanyEntity
}
