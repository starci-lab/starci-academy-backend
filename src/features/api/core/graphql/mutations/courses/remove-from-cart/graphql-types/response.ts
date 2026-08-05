import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Outcome of removing a course from the cart.",
})
/** Payload: whether a cart row was actually removed. */
export class RemoveFromCartResponseData {
    /** True when a matching cart row existed and was deleted; false when the cart had no such row. */
    @Field(
        () => Boolean,
        {
            description: "Whether a matching cart row was removed (false when nothing was in the cart).",
        },
    )
        removed: boolean
}

@ObjectType({
    description: "Response wrapper for the removeFromCart mutation.",
})
/**
 * Response wrapper for the removeFromCart mutation.
 *
 * `data` is `nullable: true` because the transform interceptor sets `data = null`
 * on the error path — a non-nullable field would crash GraphQL and mask the real
 * error.
 */
export class RemoveFromCartResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<RemoveFromCartResponseData>
{
    /** Removal outcome for the requested course. */
    @Field(
        () => RemoveFromCartResponseData,
        {
            nullable: true,
        },
    )
        data: RemoveFromCartResponseData
}
