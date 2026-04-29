import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./callback.module-definition"
import {
    GithubOauthCallbackController,
} from "./callback.controller"
import {
    GithubOauthCallbackService,
} from "./callback.service"
import {
    GithubOauthCallbackHandler,
} from "./callback.handler"

/**
 * Module for GitHub OAuth callback.
 */
@Module({
    controllers: [
        GithubOauthCallbackController,
    ],
    providers: [
        GithubOauthCallbackService,
        GithubOauthCallbackHandler,
    ],
})
export class GithubOauthCallbackModule extends ConfigurableModuleClass {}

