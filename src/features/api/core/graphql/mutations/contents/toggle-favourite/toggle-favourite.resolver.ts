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
    ToggleFavouriteRequest,
    ToggleFavouriteResponse,
} from "./graphql-types"
import {
    ToggleFavouriteService,
} from "./toggle-favourite.service"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
@Resolver()
/** GraphQL entry that authenticates before mutating favourite state. */
export class ToggleFavouriteResolver {
    constructor(
        private readonly toggleFavouriteService: ToggleFavouriteService,
    ) { }

    /**
     * Toggles a content's favourite state for the current user.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Favourite toggled successfully",
        [Locale.Vi]: "Cập nhật yêu thích thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ToggleFavouriteResponse,
        {
            name: "toggleFavourite",
            description: "Toggles a content's favourite state.",
        },
    )
    async execute(
        @Args("request")
            request: ToggleFavouriteRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.toggleFavouriteService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
