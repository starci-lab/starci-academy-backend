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
    CoursesCheckoutPreviewRequest,
} from "./graphql-types/request"
import {
    CoursesCheckoutPreviewData,
    CoursesCheckoutPreviewResponse,
} from "./graphql-types/response"
import {
    CoursesCheckoutPreviewService,
} from "./courses-checkout-preview.service"

@Resolver()
/**
 * GraphQL entry for previewing the price of a multi-course cart before checkout.
 */
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
        [Locale.Vi]: "Lấy xem trước thanh toán thành công", // vn-ok: vi-locale string emitted to clients
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
