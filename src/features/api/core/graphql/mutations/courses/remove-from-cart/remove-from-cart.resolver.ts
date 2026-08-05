import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
    GraphQLLocale,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    UserEntity,
    Locale,
} from "@modules/databases"
import {
    RemoveFromCartRequest,
    RemoveFromCartResponse,
    RemoveFromCartResponseData,
} from "./graphql-types"
import {
    RemoveFromCartService,
} from "./remove-from-cart.service"

@Resolver()
/**
 * GraphQL entry for removing a course from the current user's shopping cart.
 */
export class RemoveFromCartResolver {
    constructor(
        private readonly removeFromCartService: RemoveFromCartService,
    ) {}

    /**
     * Removes the requested course from the caller's cart (idempotent).
     *
     * @param user - Authenticated user from Keycloak.
     * @param request - Course id to remove.
     * @returns Whether a matching cart row was removed.
     */
    @UseThrottler(ThrottlerConfig.Medium)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Course removed from cart successfully",
        [Locale.Vi]: "Xóa khóa học khỏi giỏ hàng thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => RemoveFromCartResponse,
        {
            name: "removeFromCart",
            description: "Remove a course from the current user's cart (idempotent).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Course id to remove from the cart.",
            },
        )
            request: RemoveFromCartRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<RemoveFromCartResponseData> {
        return this.removeFromCartService.execute(
            {
                request,
                user,
                locale,
            },
        )
    }
}
