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
    CourseEnrollmentStatusRequest,
} from "./graphql-types/request"
import {
    CourseEnrollmentStatusData,
    CourseEnrollmentStatusResponse,
} from "./graphql-types/response"
import {
    CourseEnrollmentStatusService,
} from "./course-enrollment-status.service"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"


@Resolver()
/**
 * Auth-gated GraphQL entry for `courseEnrollmentStatus` -- returns the caller's
 * enrollment flag (and record) for one course.
 */
export class CourseEnrollmentStatusResolver {
    constructor(
        private readonly courseEnrollmentStatusService: CourseEnrollmentStatusService,
    ) {}

    /**
     * Returns whether the current user is enrolled in the course.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Course enrollment status fetched successfully",
        [Locale.Vi]: "Lấy trạng thái đăng ký khóa học thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CourseEnrollmentStatusResponse,
        {
            name: "courseEnrollmentStatus",
            description: "Returns whether the current user is enrolled in a course.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Course id for enrollment check.",
            },
        )
            request: CourseEnrollmentStatusRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CourseEnrollmentStatusData> {
        return this.courseEnrollmentStatusService.execute(
            {
                request,
                user,
                locale,
            },
        )
    }
}
