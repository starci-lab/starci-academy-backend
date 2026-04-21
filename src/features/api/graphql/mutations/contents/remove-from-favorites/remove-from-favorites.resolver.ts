import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    RemoveFromFavoritesRequest,
    RemoveFromFavoritesResponse,
} from "./graphql-types"
import {
    RemoveFromFavoritesService,
} from "./remove-from-favorites.service"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"

@Resolver()
export class RemoveFromFavoritesResolver {
    constructor(
        private readonly removeFromFavoritesService: RemoveFromFavoritesService,
    ) { }

    /**
     * Removes a content from the user's favorites.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Content removed from favorites successfully",
        [Locale.Vi]: "Xóa khỏi danh sách yêu thích thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => RemoveFromFavoritesResponse,
        {
            name: "removeFromFavorites",
            description: "Removes a content from the user's favorites.",
        },
    )
    async execute(
        @Args("request")
        request: RemoveFromFavoritesRequest,
        @GraphQLLocale()
        locale: Locale,
        @KeycloakGraphQLUser()
        user: UserEntity,
    ): Promise<RemoveFromFavoritesResponse> {
        return this.removeFromFavoritesService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
