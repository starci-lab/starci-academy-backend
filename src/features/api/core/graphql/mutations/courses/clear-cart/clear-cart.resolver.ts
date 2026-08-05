import {
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
    ClearCartResponse,
    ClearCartResponseData,
} from "./graphql-types"
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
        [Locale.Vi]: "Xóa toàn bộ giỏ hàng thành công",
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
