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
export class CourseEnrollmentStatusResolver {
    constructor(
        private readonly courseEnrollmentStatusService: CourseEnrollmentStatusService,
    ) {}

    /**
     * Total enrollments for the course; `isEnrolled` when Bearer token is sent and user has a row.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Course enrollment status fetched successfully",
        [Locale.Vi]: "Lấy trạng thái đăng ký khóa học thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CourseEnrollmentStatusResponse,
        {
            name: "courseEnrollmentStatus",
            description: "Enrollment count for a course; optional `isEnrolled` when Authorization Bearer is sent.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Course id for the enrollment summary.",
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
