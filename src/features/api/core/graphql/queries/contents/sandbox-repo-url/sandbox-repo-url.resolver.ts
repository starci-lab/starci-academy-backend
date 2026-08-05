import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
} from "@nestjs/common"
import {
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    SandboxRepoUrlService,
} from "./sandbox-repo-url.service"
import {
    SandboxRepoUrlRequest,
} from "./graphql-types"

@Resolver()
/**
 * GraphQL surface for `sandboxRepoUrl` — returns a short-lived Minio GET URL for
 * a sandbox lesson's file tree (premium requires course enrollment).
 */
export class SandboxRepoUrlResolver {

    constructor(
        private readonly sandboxRepoUrlService: SandboxRepoUrlService,
    ) { }

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @Query(
        () => String,
        {
            name: "sandboxRepoUrl",
            description: "Returns a time-limited presigned CDN URL for a premium sandbox lesson's bundled file tree.",
        },
    )
    async execute(
        @Args("request")
            request: SandboxRepoUrlRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<string> {
        return this.sandboxRepoUrlService.execute(request,
            user)
    }
}
