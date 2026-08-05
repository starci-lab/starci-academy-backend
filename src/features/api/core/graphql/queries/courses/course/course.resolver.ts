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
} from "@nestjs/common"
import {
    CourseEntity,
    GraphQLTypePricingPhase,
    Locale,
    PricingPhase,
} from "@modules/databases"
import {
    CourseStatsProjectionService,
} from "@modules/bussiness"
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
    CourseRequest,
    CourseResponse,
} from "./graphql-types"
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
    @Query(() => CourseResponse,
        {
            name: "course",
            description: "Returns a single course by id.",
        })
    async execute(
        @Args("request",
            {
                description: "Course lookup request.",
            }
        )
            request: CourseRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CourseEntity> {
        return this.courseService.execute(
            {
                request,
                locale,
            },
        )
    }
}
