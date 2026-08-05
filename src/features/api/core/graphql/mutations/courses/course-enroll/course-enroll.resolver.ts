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
    CourseEnrollRequest,
    CourseEnrollResponse,
    CourseEnrollResponseData,
} from "./graphql-types"
import {
    CourseEnrollService,
} from "./course-enroll.service"

@Resolver()
/**
 * GraphQL entry for starting course checkout (preflight + payment provider).
 */
export class CourseEnrollResolver {
    constructor(
        private readonly courseEnrollService: CourseEnrollService,
    ) {}

    /**
     * Creates a PayOS payment link and a pending `preflight_transactions` row for the user and course.
     *
     * @param user - Authenticated user from Keycloak
     * @param request - Course, tier, payment type, and PayOS URLs when applicable
     * @returns Checkout payload for the client
     */
    @UseThrottler(ThrottlerConfig.Medium)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Course checkout created successfully",
        [Locale.Vi]: "Tạo liên kết thanh toán khóa học thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => CourseEnrollResponse,
        {
            name: "courseEnroll",
            description: "Start PayOS checkout for a course; persists a preflight transaction (many per user/course).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Course, pricing tier, and PayOS return/cancel URLs.",
            },
        )
            request: CourseEnrollRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CourseEnrollResponseData> {
        return this.courseEnrollService.execute(
            {
                request,
                user,
                locale,
            },
        )
    }
}
