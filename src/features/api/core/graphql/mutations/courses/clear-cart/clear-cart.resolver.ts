import {
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
    ClearCartResponse,
    ClearCartResponseData,
} from "./graphql-types/response"
import {
    ClearCartService,
} from "./clear-cart.service"

@Resolver()
/**
 * GraphQL entry for emptying the current user's shopping cart.
 */
export class ClearCartResolver {
    constructor(
        private readonly clearCartService: ClearCartService,
    ) {}

    /**
     * Empties the caller's cart and reports how many rows were removed.
     *
     * @param user - Authenticated user from Keycloak.
     * @returns Number of cart rows removed.
     */
    @UseThrottler(ThrottlerConfig.Medium)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Cart cleared successfully",
        [Locale.Vi]: "Xóa toàn bộ giỏ hàng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ClearCartResponse,
        {
            name: "clearCart",
            description: "Remove every course from the current user's cart.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<ClearCartResponseData> {
        return this.clearCartService.execute(
            {
                request: undefined,
                user,
                locale,
            },
        )
    }
}
