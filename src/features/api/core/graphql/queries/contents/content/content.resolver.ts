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
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ContentRequest,
} from "./graphql-types/request"
import {
    ContentResponse,
} from "./graphql-types/response"
import {
    ContentQueryService,
} from "./content.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"

@Resolver(() => ContentEntity)
/**
 * GraphQL surface for `content` -- authenticated single-lesson fetch with
 * premium truncation and scrape-rate protection applied in the handler.
 */
export class ContentResolver {
    constructor(
        private readonly contentQueryService: ContentQueryService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Content fetched successfully",
        [Locale.Vi]: "Lấy nội dung thành công", // vn-ok: vi-locale string emitted to clients
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
