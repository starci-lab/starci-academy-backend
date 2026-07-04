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

/**
 * Response wrapper for the myCart query.
 *
 * `data` is `nullable: true` because the transform interceptor sets `data = null`
 * on the error path — a non-nullable field would crash GraphQL and mask the real
 * error. On the happy path it is the (possibly empty) list of cart rows.
 */
@ObjectType({
    description: "Response wrapper for the myCart query.",
})
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
