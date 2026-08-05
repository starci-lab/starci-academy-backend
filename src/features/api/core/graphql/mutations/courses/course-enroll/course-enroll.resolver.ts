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
    CourseEnrollRequest,
} from "./graphql-types/request"
import {
    CourseEnrollResponse,
    CourseEnrollResponseData,
} from "./graphql-types/response"
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
