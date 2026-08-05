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
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    SyncPersonalProjectGithubRequest,
    SyncPersonalProjectGithubResponse,
} from "./graphql-types"
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
