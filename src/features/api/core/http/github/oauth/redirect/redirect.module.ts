import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./redirect.module-definition"
import {
    GithubOauthRedirectController,
} from "./redirect.controller"
import {
    GithubOauthRedirectCommandService,
} from "./redirect.service"
import {
    GithubOauthRedirectCommandHandler,
} from "./redirect.handler"

/**
 * Module for GitHub OAuth redirect.
 */
@Module({
    controllers: [
        GithubOauthRedirectController,
    ],
    providers: [
        GithubOauthRedirectCommandService,
        GithubOauthRedirectCommandHandler,
    ],
})
export class GithubOauthRedirectModule extends ConfigurableModuleClass {}

