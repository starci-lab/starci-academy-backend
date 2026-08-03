import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    ConsultantEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Response wrapper for the single Headhunter query. */
@ObjectType({
    description: "Response wrapper for the Headhunter query.",
})
export class ConsultantResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ConsultantEntity>
{
    @Field(
        () => ConsultantEntity,
        {
            nullable: true,
            description: "headhunter payload.",
        },
    )
        data: ConsultantEntity
}
