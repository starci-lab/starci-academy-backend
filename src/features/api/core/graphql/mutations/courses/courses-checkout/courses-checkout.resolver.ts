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
    CoursesCheckoutRequest,
} from "./graphql-types/request"
import {
    CoursesCheckoutResponse,
    CoursesCheckoutResponseData,
} from "./graphql-types/response"
import {
    CoursesCheckoutService,
} from "./courses-checkout.service"

@Resolver()
/**
 * GraphQL entry for buying multiple courses in one payment (cart checkout).
 */
export class CoursesCheckoutResolver {
    constructor(
        private readonly coursesCheckoutService: CoursesCheckoutService,
    ) {}

    /**
     * Creates one gateway payment for the summed price of several courses and a
     * pending order (`transactions` row + one `transaction_items` row per course).
     *
     * @param user - Authenticated user from Keycloak.
     * @param request - Course ids, payment type, and redirect URLs.
     * @param locale - Active locale for the success message.
     * @returns Checkout payload for the client to redirect / POST.
     */
    @UseThrottler(ThrottlerConfig.Medium)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Multi-course checkout created successfully",
        [Locale.Vi]: "Tạo thanh toán nhiều khóa học thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => CoursesCheckoutResponse,
        {
            name: "coursesCheckout",
            description: "Start one checkout for several courses (cart); creates an order with a line per course.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Course ids, payment type, and redirect URLs.",
            },
        )
            request: CoursesCheckoutRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CoursesCheckoutResponseData> {
        // delegate to the service -> command handler
        return this.coursesCheckoutService.execute(
            {
                request,
                user,
                locale,
            },
        )
    }
}
