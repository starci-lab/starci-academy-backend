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
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    SavedContentsRequest,
} from "./graphql-types/request"
import {
    SavedContentsResponse,
    SavedContentsData,
} from "./graphql-types/response"
import {
    SavedContentsService,
} from "./saved-contents.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"

@Resolver()
/**
 * GraphQL surface for `savedContents` -- authenticated paginated favorites list.
 */
export class SavedContentsResolver {
    constructor(
        private readonly savedContentsService: SavedContentsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Saved contents fetched successfully",
        [Locale.Vi]: "Lấy danh sách đã lưu thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => SavedContentsResponse,
        {
            name: "savedContents",
            description: "Returns the current user's favorited contents.",
        },
    )
    async execute(
        @Args("request")
            request: SavedContentsRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<SavedContentsData> {
        return this.savedContentsService.execute({
            request,
            locale,
            user,
        })
    }
}
