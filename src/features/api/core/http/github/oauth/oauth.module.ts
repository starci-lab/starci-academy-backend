import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./oauth.module-definition"
import {
    GithubOauthRedirectModule,
} from "./redirect/redirect.module"
import {
    GithubOauthCallbackModule,
} from "./callback/callback.module"

@Module({
    imports: [
        GithubOauthRedirectModule.register({
            isGlobal: true,
        }),
        GithubOauthCallbackModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Module for GitHub OAuth.
 */
export class GithubOauthModule extends ConfigurableModuleClass {}

