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
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ToggleFavouriteRequest,
} from "./graphql-types/request"
import {
    ToggleFavouriteResponse,
} from "./graphql-types/response"
import {
    ToggleFavouriteService,
} from "./toggle-favourite.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
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
        [Locale.Vi]: "Cập nhật yêu thích thành công", // vn-ok: vi-locale string emitted to clients
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
