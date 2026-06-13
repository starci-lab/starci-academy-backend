import {
    Args,
    ID,
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
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    AiLabPlaygroundEntity,
    Locale,
} from "@modules/databases"
import {
    AiLabPlaygroundService,
} from "@modules/bussiness"
import {
    AiLabPlaygroundResponse,
} from "./graphql-types"

/**
 * Returns the AI Lab playground attached to a lesson (by content id), with its
 * `label` / `description` localized to the request and translations stripped.
 * Drives the playground panel rendered inside a lesson.
 */
@Resolver()
export class AiLabPlaygroundResolver {
    constructor(
        private readonly aiLabPlaygroundService: AiLabPlaygroundService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "AI Lab playground fetched successfully",
        [Locale.Vi]: "Lấy phòng thí nghiệm AI thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => AiLabPlaygroundResponse,
        {
            name: "aiLabPlayground",
            description: "Returns the AI Lab playground config attached to a lesson (by content id).",
        },
    )
    async execute(
        @Args(
            "contentId",
            {
                type: () => ID,
            },
        )
            contentId: string,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<AiLabPlaygroundEntity | null> {
        // delegate the localized playground load to the business service
        const {
            playground,
        } = await this.aiLabPlaygroundService.getPlaygroundForLesson({
            contentId,
            locale,
        })
        return playground
    }
}
