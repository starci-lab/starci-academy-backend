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
    LessonVideoEntity,
    Locale,
} from "@modules/databases"
import {
    LessonVideoRequest,
    LessonVideoResponse,
} from "./graphql-types"
import {
    LessonVideoQueryService,
} from "./lesson-video.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"

@Resolver(() => LessonVideoEntity)
export class LessonVideoResolver {
    constructor(
        private readonly lessonVideoQueryService: LessonVideoQueryService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Lesson video fetched successfully",
        [Locale.Vi]: "Lấy video bài học thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => LessonVideoResponse,
        {
            name: "lessonVideo",
            description: "Returns a single lesson video by primary id.",
        },
    )
    async execute(
        @Args("request")
            request: LessonVideoRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<LessonVideoEntity> {
        return this.lessonVideoQueryService.execute(
            {
                request,
                locale,
            },
        )
    }
}
