import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Outcome of clearing the current user's cart.",
})
/** Payload: how many cart rows were cleared. */
export class ClearCartResponseData {
    /** Number of cart rows deleted for the user (0 when the cart was already empty). */
    @Field(
        () => Int,
        {
            description: "Number of cart rows removed (0 when the cart was already empty).",
        },
    )
        removedCount: number
}

@ObjectType({
    description: "Response wrapper for the clearCart mutation.",
})
/**
 * Response wrapper for the clearCart mutation.
 *
 * `data` is `nullable: true` because the transform interceptor sets `data = null`
 * on the error path — a non-nullable field would crash GraphQL and mask the real
 * error.
 */
export class ClearCartResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ClearCartResponseData>
{
    /** Count of cart rows removed for the current user. */
    @Field(
        () => ClearCartResponseData,
        {
            nullable: true,
        },
    )
        data: ClearCartResponseData
}
