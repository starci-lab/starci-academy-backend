import {
    Query,
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
    CartItemEntity,
} from "@modules/databases"
import {
    MyCartResponse,
} from "./graphql-types"
import {
    MyCartService,
} from "./my-cart.service"

/**
 * GraphQL entry for listing the current user's shopping cart.
 */
@Resolver()
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
        [Locale.Vi]: "Lấy giỏ hàng thành công",
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
