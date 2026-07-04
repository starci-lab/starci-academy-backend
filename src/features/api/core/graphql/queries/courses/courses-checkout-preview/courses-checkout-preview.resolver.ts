import {
    Args,
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
} from "@modules/databases"
import {
    CoursesCheckoutPreviewData,
    CoursesCheckoutPreviewRequest,
    CoursesCheckoutPreviewResponse,
} from "./graphql-types"
import {
    CoursesCheckoutPreviewService,
} from "./courses-checkout-preview.service"

/**
 * GraphQL entry for previewing the price of a multi-course cart before checkout.
 */
@Resolver()
export class CoursesCheckoutPreviewResolver {
    constructor(
        private readonly coursesCheckoutPreviewService: CoursesCheckoutPreviewService,
    ) {}

    /**
     * Price a set of courses as one order (progressive loyalty + bundle bonus) so
     * the cart can show the real discounted total and per-course savings.
     *
     * @param user - Authenticated user from Keycloak.
     * @param request - The course ids in the cart.
     * @param locale - Active locale for the success message.
     * @returns The per-course preview lines + order totals.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Checkout preview fetched successfully",
        [Locale.Vi]: "Lấy xem trước thanh toán thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CoursesCheckoutPreviewResponse,
        {
            name: "coursesCheckoutPreview",
            description: "Price several courses as one order (progressive loyalty + bundle bonus) for the cart.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Course ids in the cart to price as one order.",
            },
        )
            request: CoursesCheckoutPreviewRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CoursesCheckoutPreviewData> {
        // delegate to the service, which reuses the checkout pricing (single source)
        return this.coursesCheckoutPreviewService.execute(
            {
                request,
                user,
                locale,
            },
        )
    }
}
