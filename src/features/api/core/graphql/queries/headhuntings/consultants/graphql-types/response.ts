import {
    ConsultantEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"

/**
 * Headhunters response data.
 */
@ObjectType({
    description: "Response data for Headhunters query.",
})
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

/**
 * Consultants query response wrapper.
 */
@ObjectType({
    description: "Response for consultants query.",
})
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
