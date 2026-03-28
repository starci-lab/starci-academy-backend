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
    CoursesInput,
    CoursesResponse,
    CoursesResponseData,
} from "./graphql-types"
import {
    CoursesService,
} from "./courses.service"

@Resolver()
export class CoursesResolver {
    constructor(
        private readonly coursesService: CoursesService,
    ) {}

    /**
     * Lists courses with page-based pagination.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage("Courses fetched successfully")
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(() => CoursesResponse,
        {
            description: "Lists courses with page-based pagination.",
        })
    async courses(
        @Args("input",
            {
                description: "Pagination and sort input.",
            }
        )
            input: CoursesInput,
    ): Promise<CoursesResponseData> {
        return this.coursesService.execute(input)
    }
}
