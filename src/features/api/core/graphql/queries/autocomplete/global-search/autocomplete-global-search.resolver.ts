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
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    AutocompleteGlobalSearchRequest,
} from "./graphql-types/request"
import {
    AutocompleteGlobalSearchResponse,
    AutocompleteGlobalSearchData,
} from "./graphql-types/response"
import {
    AutocompleteGlobalSearchService,
} from "./autocomplete-global-search.service"

@Resolver()
/**
 * Public (optionally-authed) typeahead across every indexed catalog kind.
 * Auth is optional so guests still get hits; enrollment/premium flags only
 * appear when a user is present.
 */
export class AutocompleteGlobalSearchResolver {
    constructor(
        private readonly autocompleteGlobalSearchService: AutocompleteGlobalSearchService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Global search results fetched successfully",
        [Locale.Vi]: "Lấy kết quả tìm kiếm toàn cục thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => AutocompleteGlobalSearchResponse,
        {
            name: "autocompleteGlobalSearch",
            description: "Returns grouped autocomplete results across indexed entities using Elasticsearch fuzzy search.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity | undefined,
        @Args(
            "request",
            {
                description: "Global search request.",
            },
        )
            request: AutocompleteGlobalSearchRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<AutocompleteGlobalSearchData> {
        return this.autocompleteGlobalSearchService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}

