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
    CoursesRequest,
    CoursesResponse,
    CoursesResponseData,
} from "./graphql-types"
import {
    CoursesService,
} from "./courses.service"
import {
    Locale 
} from "@modules/databases"

@Resolver()
export class CoursesResolver {
    constructor(
        private readonly coursesService: CoursesService,
    ) {}

    /**
     * Lists courses with page-based pagination.
     */
    @UseThrottler(ThrottlerConfig.Soft)
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
        @Args("request",
            {
                description: "Pagination and sort request.",
            }
        )
            request: CoursesRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CoursesResponseData> {
        return this.coursesService.execute(
            {
                request,
                locale,
            },
        )
    }
}
