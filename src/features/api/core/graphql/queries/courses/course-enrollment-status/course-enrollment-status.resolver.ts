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
    CourseEnrollmentStatusData,
    CourseEnrollmentStatusRequest,
    CourseEnrollmentStatusResponse,
} from "./graphql-types"
import {
    CourseEnrollmentStatusService,
} from "./course-enrollment-status.service"
import {
    UserEntity,
    Locale,
} from "@modules/databases"


@Resolver()
/**
 * Auth-gated GraphQL entry for `courseEnrollmentStatus` — returns the caller's
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
