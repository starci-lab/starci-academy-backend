import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    ConsultantEntity,
} from "@modules/databases/postgresql/primary/entities/consultant.entity"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Response wrapper for the Headhunter query.",
})
/** Response wrapper for the single Headhunter query. */
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
