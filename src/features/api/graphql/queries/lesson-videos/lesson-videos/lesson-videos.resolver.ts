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
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    LessonVideosRequest,
    LessonVideosResponse,
    LessonVideosResponseData,
} from "./graphql-types"
import {
    LessonVideosService,
} from "./lesson-videos.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"

@Resolver()
export class LessonVideosResolver {
    constructor(
        private readonly lessonVideosService: LessonVideosService,
    ) {}

    /**
     * Lists lesson videos for a module with page-based pagination.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Lesson videos fetched successfully",
        [Locale.Vi]: "Lấy danh sách video bài học thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => LessonVideosResponse,
        {
            name: "lessonVideos",
            description: "Lists lesson videos for a module with page-based pagination.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Module id, pagination, and sort request.",
            },
        )
            request: LessonVideosRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<LessonVideosResponseData> {
        return this.lessonVideosService.execute(
            {
                request,
                locale,
            },
        )
    }
}
