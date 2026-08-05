import {
    Query,
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
    CartItemEntity,
} from "@modules/databases/postgresql/primary/entities/cart-item.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MyCartResponse,
} from "./graphql-types/response"
import {
    MyCartService,
} from "./my-cart.service"

@Resolver()
/**
 * GraphQL entry for listing the current user's shopping cart.
 */
export class MyCartResolver {
    constructor(
        private readonly myCartService: MyCartService,
    ) {}

    /**
     * Returns the caller's cart rows with course relations loaded.
     *
     * @param user - Authenticated user from Keycloak.
     * @returns The current user's cart rows, oldest first.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Cart fetched successfully",
        [Locale.Vi]: "Lấy giỏ hàng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyCartResponse,
        {
            name: "myCart",
            description: "List the current user's cart (each row with its course relation loaded).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<Array<CartItemEntity>> {
        return this.myCartService.execute(
            {
                request: undefined,
                user,
                locale,
            },
        )
    }
}
