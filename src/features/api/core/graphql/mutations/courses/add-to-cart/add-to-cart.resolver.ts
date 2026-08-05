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
    CartItemEntity,
} from "@modules/databases"
import {
    AddToCartRequest,
    AddToCartResponse,
} from "./graphql-types"
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
