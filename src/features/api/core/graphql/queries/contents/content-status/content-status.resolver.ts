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
    ContentStatusRequest,
} from "./graphql-types/request"
import {
    ContentStatusResponse,
    ContentStatusData,
} from "./graphql-types/response"
import {
    ContentStatusService,
} from "./content-status.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"

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
