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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
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
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness/guards/graphql-must-enrolled.guard"
import {
    SyncPersonalProjectGithubRequest,
} from "./graphql-types/request"
import {
    SyncPersonalProjectGithubResponse,
} from "./graphql-types/response"
import {
    SyncPersonalProjectGithubService,
} from "./sync-personal-project-github.service"

@Resolver()
/**
 * GraphQL entry for syncing the personal project GitHub URL for the current user.
 */
export class SyncPersonalProjectGithubResolver {
    constructor(
        private readonly syncPersonalProjectGithubService: SyncPersonalProjectGithubService,
    ) {}

    /**
     * GraphQL entry for syncing the personal project GitHub URL for the current user.
     * @param user - The user.
     * @param request - The request.
     * @param locale - The locale.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Personal project GitHub URL synced successfully",
        [Locale.Vi]: "Đồng bộ GitHub URL dự án cá nhân thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SyncPersonalProjectGithubResponse,
        {
            name: "syncPersonalProjectGithub",
            description: "Sync (upsert) the user's personal project GitHub URL with validation.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Personal project GitHub URL sync request.",
            },
        )
            request: SyncPersonalProjectGithubRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<void> {
        await this.syncPersonalProjectGithubService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
