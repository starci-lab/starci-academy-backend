import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    CartItemEntity,
} from "@modules/databases"

@ObjectType({
    description: "Response wrapper for the addToCart mutation.",
})
/**
 * Response wrapper for the addToCart mutation.
 *
 * `data` carries the created (or pre-existing, when idempotent) cart row. It is
 * marked `nullable: true` because the transform interceptor sets `data = null`
 * on the error path — a non-nullable field would crash GraphQL and mask the real
 * error instead of surfacing it.
 */
export class AddToCartResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CartItemEntity>
{
    /** The cart row that now holds the course (created or already present). */
    @Field(
        () => CartItemEntity,
        {
            nullable: true,
            description: "The cart row holding the course after the add.",
        },
    )
        data: CartItemEntity
}
