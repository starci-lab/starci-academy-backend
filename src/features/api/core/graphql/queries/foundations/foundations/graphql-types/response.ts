import {
    FoundationEntity,
} from "@modules/databases"
import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"

/**
 * Foundations response data.
 */
@ObjectType({
    description: "Response data for foundations query.",
})
export class FoundationsResponseData {
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
     * The array of foundation records.
     */
    @Field(
        () => [
            FoundationEntity
        ],
        {
            description: "The foundations.",
        }
    )
        data: Array<FoundationEntity>
}

/**
 * Foundations response payload.
 */
@ObjectType({
    description: "Response for foundations query.",
})
export class FoundationsResponse {
    /**
     * The response data.
     */
    @Field(
        () => FoundationsResponseData,
        {
            description: "The response data.",
        }
    )
        data: FoundationsResponseData
}
