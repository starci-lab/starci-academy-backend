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
    KeycloakGraphQLUser,
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
export class AutocompleteGlobalSearchResolver {
    constructor(
        private readonly autocompleteGlobalSearchService: AutocompleteGlobalSearchService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Global search results fetched successfully",
        [Locale.Vi]: "Lấy kết quả tìm kiếm toàn cục thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => AutocompleteGlobalSearchResponse,
        {
            name: "autocompleteGlobalSearch",
            description: "Returns grouped autocomplete results scoped to the caller's enrolled courses.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
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

