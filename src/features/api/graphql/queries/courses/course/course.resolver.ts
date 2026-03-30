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
    @GraphQLSuccessMessage("Course fetched successfully")
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(() => CourseResponse,
        {
            description: "Returns a single course by id.",
        })
    async course(
        @Args("request",
            {
                description: "Course lookup request.",
            }
        )
            request: CourseRequest,
    ): Promise<CourseEntity> {
        return this.courseService.execute(request)
    }
}
