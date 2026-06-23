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
    MyGithubTeamStatusResponse,
    MyGithubTeamStatusData,
} from "./graphql-types"
import {
    MyGithubTeamStatusService,
} from "./my-github-team-status.service"

/**
 * Query: the authenticated viewer's GitHub link + per-enrolled-course team
 * membership status. Drives the forced "join team" flow (link vs in-team are
 * separate states) — auth-only (no MustEnrolled, the FE handles the no-team case).
 */
@Resolver()
export class MyGithubTeamStatusResolver {
    constructor(
        private readonly service: MyGithubTeamStatusService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "GitHub team status fetched successfully",
        [Locale.Vi]: "Lấy trạng thái team GitHub thành công",
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
