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
    In,
    EntityManager,
} from "typeorm"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
    GraphQLLocale,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    KeycloakGraphQLUser,
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    CoursesRequest,
    CoursesResponse,
    CoursesResponseData,
} from "./graphql-types"
import {
    CoursesService,
} from "./courses.service"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserEntity,
} from "@modules/databases"

@Resolver()
export class CoursesResolver {
    constructor(
        private readonly coursesService: CoursesService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Lists courses with page-based pagination. Optional auth — anonymous
     * viewers may call it (`isEnrolled` stays null on every row); an
     * authenticated viewer's enrollment is looked up in ONE batched query
     * across the page's course ids (never N+1 per row).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Courses fetched successfully",
        [Locale.Vi]: "Lấy danh sách khóa học thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(() => CoursesResponse,
        {
            name: "courses",
            description: "Lists courses with page-based pagination.",
        })
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("request",
            {
                description: "Pagination and sort request.",
            }
        )
            request: CoursesRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CoursesResponseData> {
        const response = await this.coursesService.execute(
            {
                request,
                locale,
            },
        )
        if (!user) {
            return response
        }
        const courseIds = response.data.map((course) => course.id)
        const enrollments = courseIds.length > 0
            ? await this.entityManager.find(
                EnrollmentEntity,
                {
                    where: {
                        user: {
                            id: user.id,
                        },
                        course: {
                            id: In(courseIds),
                        },
                    },
                },
            )
            : []
        const isEnrolledByCourseId = new Map(
            enrollments.map((enrollment) => [enrollment.courseId, enrollment.isEnrolled]),
        )
        response.data.forEach((course) => {
            course.isEnrolled = isEnrolledByCourseId.get(course.id) ?? false
        })
        return response
    }
}
