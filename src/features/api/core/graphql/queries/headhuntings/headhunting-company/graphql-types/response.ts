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

/** Response wrapper for the single headhunting company query. */
@ObjectType({
    description: "Response wrapper for the Headhunter query.",
})
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
