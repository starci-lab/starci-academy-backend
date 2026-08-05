import {
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
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
    MyGithubTeamStatusResponse,
    MyGithubTeamStatusData,
} from "./graphql-types/response"
import {
    MyGithubTeamStatusService,
} from "./my-github-team-status.service"

@Resolver()
/**
 * Query: the authenticated viewer's GitHub link + per-enrolled-course team
 * membership status. Drives the forced "join team" flow (link vs in-team are
 * separate states) -- auth-only (no MustEnrolled, the FE handles the no-team case).
 */
export class MyGithubTeamStatusResolver {
    constructor(
        private readonly service: MyGithubTeamStatusService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "GitHub team status fetched successfully",
        [Locale.Vi]: "Lấy trạng thái team GitHub thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyGithubTeamStatusResponse,
        {
            name: "myGithubTeamStatus",
            description: "The viewer's GitHub link + per-enrolled-course team membership status.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MyGithubTeamStatusData> {
        return this.service.execute(user)
    }
}
