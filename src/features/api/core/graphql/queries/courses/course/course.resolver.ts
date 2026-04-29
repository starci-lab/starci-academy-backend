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
    CacheKey,
    CacheService,
} from "@modules/cache"
import {
    CourseEntity,
    EnrollmentEntity,
    GraphQLTypePricingPhase,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    PricingPhase,
} from "@modules/databases"
import type {
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
    CourseRequest,
    CourseResponse,
} from "./graphql-types"
import {
    CourseService,
} from "./course.service"

@Resolver(() => CourseEntity)
@Injectable()
export class CourseResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly cacheService: CacheService,
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
        return course.metadata?.currentPhase ?? PricingPhase.Regular
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
        const cachedEnrollmentCount = await this.cacheService.get({
            key: CacheKey.CourseEnrollmentCount,
            args: [course.id],
        })
        if (cachedEnrollmentCount !== undefined) {
            return cachedEnrollmentCount
        }
        const enrollmentCount = await this.entityManager.count(
            EnrollmentEntity,
            {
                where: {
                    course: {
                        id: course.id,
                    },
                },
            },
        )
        await this.cacheService.set({
            key: CacheKey.CourseEnrollmentCount,
            args: [course.id],
            cacheResult: enrollmentCount,
        })
        return enrollmentCount
    }

    /**
     * Returns a single course by id.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Course fetched successfully",
        [Locale.Vi]: "Lấy khóa học thành công",
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
