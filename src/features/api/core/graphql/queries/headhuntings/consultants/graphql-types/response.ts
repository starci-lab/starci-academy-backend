import {
    ConsultantEntity,
} from "@modules/databases/postgresql/primary/entities/consultant.entity"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response data for Headhunters query.",
})
/**
 * Headhunters response data.
 */
export class ConsultantsResponseData {
    /**
     * The total count.
     */
    @Field(
        () => Int,
        {
            description: "The total count.",
        }
    )
        count: number

    /**
     * The array of Headhunter records.
     */
    @Field(
        () => [
            ConsultantEntity
        ],
        {
            description: "The foundations.",
        }
    )
        data: Array<ConsultantEntity>
}

@ObjectType({
    description: "Response for consultants query.",
})
/**
 * Consultants query response wrapper.
 */
export class ConsultantsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ConsultantsResponseData>
{
    @Field(
        () => ConsultantsResponseData,
        {
            description: "Paginated consultants payload.",
        },
    )
        data: ConsultantsResponseData
}
