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
    KeycloakGraphQLUser,
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    AutocompleteGlobalSearchRequest,
} from "./graphql-types"
import {
    AutocompleteGlobalSearchResponse,
    AutocompleteGlobalSearchData,
} from "./graphql-types"
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
        [Locale.Vi]: "Lấy kết quả tìm kiếm toàn cục thành công",
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

