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
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    CoursesRequest,
} from "./graphql-types/request"
import {
    CoursesResponse,
    CoursesResponseData,
} from "./graphql-types/response"
import {
    CoursesService,
} from "./courses.service"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"

@Resolver()
/**
 * Optional-auth GraphQL entry for `courses` -- anonymous viewers get the page
 * with `isEnrolled` unset; authenticated viewers get a single batched
 * enrollment lookup across the page (never N+1 per row).
 */
export class CoursesResolver {
    constructor(
        private readonly coursesService: CoursesService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Lists courses with page-based pagination. Optional auth -- anonymous
     * viewers may call it (`isEnrolled` stays null on every row); an
     * authenticated viewer's enrollment is looked up in ONE batched query
     * across the page's course ids (never N+1 per row).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Courses fetched successfully",
        [Locale.Vi]: "Lấy danh sách khóa học thành công", // vn-ok: vi-locale string emitted to clients
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
            enrollments.map((enrollment) => [enrollment.courseId,
                enrollment.isEnrolled]),
        )
        response.data.forEach((course) => {
            course.isEnrolled = isEnrolledByCourseId.get(course.id) ?? false
        })
        return response
    }
}
