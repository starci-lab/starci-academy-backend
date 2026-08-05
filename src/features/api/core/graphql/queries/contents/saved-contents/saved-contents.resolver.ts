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
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    SavedContentsRequest,
    SavedContentsResponse,
    SavedContentsData,
} from "./graphql-types"
import {
    SavedContentsService,
} from "./saved-contents.service"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"

@Resolver()
/**
 * GraphQL surface for `savedContents` — authenticated paginated favorites list.
 */
export class SavedContentsResolver {
    constructor(
        private readonly savedContentsService: SavedContentsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Saved contents fetched successfully",
        [Locale.Vi]: "Lấy danh sách đã lưu thành công",
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
