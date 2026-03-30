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
    UserEntity 
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
    @GraphQLSuccessMessage("Course enrollment status fetched successfully")
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CourseEnrollmentStatusResponse,
        {
            description: "Enrollment count for a course; optional `isEnrolled` when Authorization Bearer is sent.",
        },
    )
    async courseEnrollmentStatus(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Course id for the enrollment summary.",
            },
        )
            request: CourseEnrollmentStatusRequest,
    ): Promise<CourseEnrollmentStatusData> {
        return this.courseEnrollmentStatusService.execute(
            request,
            user,
        )
    }
}
