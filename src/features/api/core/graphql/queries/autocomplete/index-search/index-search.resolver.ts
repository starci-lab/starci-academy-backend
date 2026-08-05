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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    IndexSearchRequest,
} from "./graphql-types/request"
import {
    IndexSearchData,
    IndexSearchResponse,
} from "./graphql-types/response"
import {
    IndexSearchService,
} from "./index-search.service"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

@Resolver()
/**
 * Auth-gated fuzzy search against one chosen ES catalog index. Unlike global
 * search this returns a flat list (one kind) with parent displayIds attached.
 */
export class IndexSearchResolver {
    constructor(
        private readonly indexSearchService: IndexSearchService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Index search results fetched successfully",
        [Locale.Vi]: "Lấy kết quả index search thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => IndexSearchResponse,
        {
            name: "indexSearch",
            description: "Fuzzy search on selected Elasticsearch index type with sync-indexer parent path.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Index search request.",
            },
        )
            request: IndexSearchRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<IndexSearchData> {
        return this.indexSearchService.execute({
            request,
            locale,
        })
    }
}
