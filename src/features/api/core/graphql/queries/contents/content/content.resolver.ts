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
    ContentEntity,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    ContentRequest,
    ContentResponse,
} from "./graphql-types"
import {
    ContentQueryService,
} from "./content.service"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"

@Resolver(() => ContentEntity)
/**
 * GraphQL surface for `content` — authenticated single-lesson fetch with
 * premium truncation and scrape-rate protection applied in the handler.
 */
export class ContentResolver {
    constructor(
        private readonly contentQueryService: ContentQueryService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Content fetched successfully",
        [Locale.Vi]: "Lấy nội dung thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ContentResponse,
        {
            name: "content",
            description: "Returns a single module content row by primary id.",
        },
    )
    async execute(
        @Args("request")
            request: ContentRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ContentEntity> {
        return this.contentQueryService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
