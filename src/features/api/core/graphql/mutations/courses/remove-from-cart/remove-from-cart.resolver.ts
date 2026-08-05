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
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    RemoveFromCartRequest,
} from "./graphql-types/request"
import {
    RemoveFromCartResponse,
    RemoveFromCartResponseData,
} from "./graphql-types/response"
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
        [Locale.Vi]: "Xóa khóa học khỏi giỏ hàng thành công", // vn-ok: vi-locale string emitted to clients
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
