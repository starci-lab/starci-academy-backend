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
    CourseInput,
    CourseResponse,
    CourseResponseData,
} from "./graphql-types"
import {
    CourseService,
} from "./course.service"

@Resolver()
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
        @Args("input",
            {
                description: "Course id input.",
            }
        )
            input: CourseInput,
    ): Promise<CourseResponseData> {
        return this.courseService.execute(input)
    }
}
