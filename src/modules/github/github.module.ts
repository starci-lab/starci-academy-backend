import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./github.module-definition"
import {
    GithubOauthRedirectService,
} from "./oauth-redirect.service"
import {
    GithubApiAuthService,
} from "./auth.service"
import {
    GithubApiOrgService,
} from "./org.service"
import {
    GithubTeamRepoSyncService,
} from "./team-repo-sync.service"

/**
 * Module for GitHub OAuth.
 */
@Module({
    providers: [
        GithubOauthRedirectService,
        GithubApiAuthService,
        GithubApiOrgService,
        GithubTeamRepoSyncService,
    ],
    exports: [
        GithubOauthRedirectService,
        GithubApiAuthService,
        GithubApiOrgService,
        GithubTeamRepoSyncService,
    ],
})
export class GithubModule extends ConfigurableModuleClass {
}

