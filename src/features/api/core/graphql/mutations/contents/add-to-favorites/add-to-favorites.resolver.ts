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
    GraphQLTransformInterceptor,
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
    AddToFavoritesRequest,
    AddToFavoritesResponse,
} from "./graphql-types"
import {
    AddToFavoritesService,
} from "./add-to-favorites.service"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"

@Resolver()
export class AddToFavoritesResolver {
    constructor(
        private readonly addToFavoritesService: AddToFavoritesService,
    ) { }

    /**
     * Adds a content to the user's favorites.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Content added to favorites successfully",
        [Locale.Vi]: "Thêm vào danh sách yêu thích thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => AddToFavoritesResponse,
        {
            name: "addToFavorites",
            description: "Adds a content to the user's favorites.",
        },
    )
    async execute(
        @Args("request")
            request: AddToFavoritesRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<AddToFavoritesResponse> {
        return this.addToFavoritesService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
