import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./oauth.module-definition"
import {
    GithubOauthRedirectModule,
} from "./redirect"
import {
    GithubOauthCallbackModule,
} from "./callback"

/**
 * Module for GitHub OAuth.
 */
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
export class GithubOauthModule extends ConfigurableModuleClass {}

