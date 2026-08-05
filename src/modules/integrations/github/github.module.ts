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

@Module({
    providers: [
        GithubOauthRedirectService,
        GithubApiAuthService,
        GithubApiOrgService,
    ],
    exports: [
        GithubOauthRedirectService,
        GithubApiAuthService,
        GithubApiOrgService,
    ],
})
/**
 * Module for GitHub OAuth.
 */
export class GithubModule extends ConfigurableModuleClass {
}

