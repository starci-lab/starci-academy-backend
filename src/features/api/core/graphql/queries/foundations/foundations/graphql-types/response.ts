import {
    FoundationEntity,
} from "@modules/databases"
import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"

@ObjectType({
    description: "Response data for foundations query.",
})
/**
 * Foundations response data.
 */
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

@ObjectType({
    description: "Response for foundations query.",
})
/**
 * Foundations response payload.
 */
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
