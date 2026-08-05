import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    CartItemEntity,
} from "@modules/databases/postgresql/primary/entities/cart-item.entity"

@ObjectType({
    description: "Response wrapper for the myCart query.",
})
/**
 * Response wrapper for the myCart query.
 *
 * `data` is `nullable: true` because the transform interceptor sets `data = null`
 * on the error path -- a non-nullable field would crash GraphQL and mask the real
 * error. On the happy path it is the (possibly empty) list of cart rows.
 */
export class MyCartResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<CartItemEntity>>
{
    /** The current user's cart rows, each with its course relation loaded, oldest first. */
    @Field(
        () => [CartItemEntity],
        {
            nullable: true,
            description: "The current user's cart rows (course relation loaded), oldest first.",
        },
    )
        data: Array<CartItemEntity>
}
