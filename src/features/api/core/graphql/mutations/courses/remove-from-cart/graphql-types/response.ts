import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Payload: whether a cart row was actually removed. */
@ObjectType({
    description: "Outcome of removing a course from the cart.",
})
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

/**
 * Response wrapper for the removeFromCart mutation.
 *
 * `data` is `nullable: true` because the transform interceptor sets `data = null`
 * on the error path — a non-nullable field would crash GraphQL and mask the real
 * error.
 */
@ObjectType({
    description: "Response wrapper for the removeFromCart mutation.",
})
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
