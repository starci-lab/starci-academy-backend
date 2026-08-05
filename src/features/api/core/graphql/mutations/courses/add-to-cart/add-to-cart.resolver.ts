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
    CartItemEntity,
} from "@modules/databases/postgresql/primary/entities/cart-item.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    AddToCartRequest,
} from "./graphql-types/request"
import {
    AddToCartResponse,
} from "./graphql-types/response"
import {
    AddToCartService,
} from "./add-to-cart.service"

@Resolver()
/**
 * GraphQL entry for adding a course to the current user's shopping cart.
 */
export class AddToCartResolver {
    constructor(
        private readonly addToCartService: AddToCartService,
    ) {}

    /**
     * Adds the requested course to the caller's cart (idempotent).
     *
     * @param user - Authenticated user from Keycloak.
     * @param request - Course id to add.
     * @returns The cart row holding the course.
     */
    @UseThrottler(ThrottlerConfig.Medium)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Course added to cart successfully",
        [Locale.Vi]: "Thêm khóa học vào giỏ hàng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => AddToCartResponse,
        {
            name: "addToCart",
            description: "Add a course to the current user's cart (idempotent per user × course).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Course id to add to the cart.",
            },
        )
            request: AddToCartRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CartItemEntity> {
        return this.addToCartService.execute(
            {
                request,
                user,
                locale,
            },
        )
    }
}
