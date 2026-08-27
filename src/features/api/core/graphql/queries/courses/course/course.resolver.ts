import {
    Args,
    Int,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from "@nestjs/graphql"
import {
    Injectable,
    UseInterceptors,
    UseGuards,
} from "@nestjs/common"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    GraphQLTypePricingPhase,
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    CourseStatsProjectionService,
} from "@modules/bussiness/projections/course-stats/course-stats-projection.service"
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
    CourseRequest,
} from "./graphql-types/request"
import {
    CourseResponse,
} from "./graphql-types/response"
import {
    CourseService,
} from "./course.service"

@Resolver(() => CourseEntity)
@Injectable()
/**
 * GraphQL entry for `course` plus field resolvers for live pricing phase and
 * enrollment count (from the course-stats projection, not a per-call count).
 */
export class CourseResolver {
    constructor(
        private readonly courseStatsProjectionService: CourseStatsProjectionService,
        private readonly courseService: CourseService,
        private readonly userService: UserService,
    ) {}

    /**
     * Returns the current pricing phase applied to the course.
     */
    @ResolveField(
        () => GraphQLTypePricingPhase,
        {
            description: "Current pricing phase applied to the course.",
        },
    )
    currentPhase(
            @Parent()
                course: CourseEntity,
    ): PricingPhase {
        // metadata is seeded (seed-if-missing) with the app.yaml default (EarlyBird);
        // fall back to EarlyBird -- NOT Regular -- when it is somehow absent, so the UI
        // does not wrongly mark every earlier phase as sold out.
        return course.metadata?.currentPhase ?? PricingPhase.EarlyBird
    }

    /**
     * Returns the total number of enrollments for the course.
     */
    @ResolveField(
        () => Int,
        {
            description: "Total number of enrollments for the course.",
        },
    )
    async enrollmentCount(
        @Parent()
            course: CourseEntity,
    ): Promise<number> {
        // read from the flat course-stats projection (lazy-recomputed if stale);
        // replaces the old Redis CourseEnrollmentCount cache
        const stats = await this.courseStatsProjectionService.getStats(course.id)
        return stats.enrollmentCount
    }

    /**
     * Returns a single course by id.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Course fetched successfully",
        [Locale.Vi]: "Lấy khóa học thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @Query(() => CourseResponse,
        {
            name: "course",
            description: "Returns a single course by id.",
        })
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("request",
            {
                description: "Course lookup request.",
            }
        )
            request: CourseRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CourseEntity> {
        const course = await this.courseService.execute(
            {
                request,
                locale,
            },
        )
        if (!user) {
            course.isEnrolled = null
            return course
        }
        course.isEnrolled = await this.userService.checkEnrollment(user.id,
            course.id)
        return course
    }
}
