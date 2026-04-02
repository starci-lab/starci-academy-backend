import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
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
import {
    CourseEntity,
    Locale,
} from "@modules/databases"

@Resolver(() => CourseEntity)
export class CourseResolver {
    constructor(
        private readonly courseService: CourseService,
    ) {}

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
