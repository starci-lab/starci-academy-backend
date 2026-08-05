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
} from "@modules/databases"
import {
    CoursesCheckoutRequest,
    CoursesCheckoutResponse,
    CoursesCheckoutResponseData,
} from "./graphql-types"
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
        [Locale.Vi]: "Tạo thanh toán nhiều khóa học thành công",
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
        // delegate to the service → command handler
        return this.coursesCheckoutService.execute(
            {
                request,
                user,
                locale,
            },
        )
    }
}
