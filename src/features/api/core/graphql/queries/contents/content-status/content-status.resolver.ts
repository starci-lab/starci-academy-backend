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
    ContentStatusRequest,
    ContentStatusResponse,
    ContentStatusData,
} from "./graphql-types"
import {
    ContentStatusService,
} from "./content-status.service"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"

@Resolver()
/**
 * GraphQL surface for `contentStatus` -- authenticated read/favorite snapshot
 * for a single content id (drives lesson chrome chips).
 */
export class ContentStatusResolver {
    constructor(
        private readonly contentStatusService: ContentStatusService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Content status fetched successfully",
        [Locale.Vi]: "Lấy trạng thái nội dung thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ContentStatusResponse,
        {
            name: "contentStatus",
            description: "Returns the current user's read/favorite status for a content.",
        },
    )
    async execute(
        @Args("request")
            request: ContentStatusRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ContentStatusData> {
        return this.contentStatusService.execute({
            request,
            locale,
            user,
        })
    }
}
