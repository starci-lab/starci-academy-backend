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
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    IndexSearchData,
    IndexSearchRequest,
    IndexSearchResponse,
} from "./graphql-types"
import {
    IndexSearchService,
} from "./index-search.service"
import {
    Locale,
} from "@modules/databases"

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
