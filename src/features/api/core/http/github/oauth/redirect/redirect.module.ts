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

@Module({
    controllers: [
        GithubOauthRedirectController,
    ],
    providers: [
        GithubOauthRedirectCommandService,
        GithubOauthRedirectCommandHandler,
    ],
})
/**
 * Module for GitHub OAuth redirect.
 */
export class GithubOauthRedirectModule extends ConfigurableModuleClass {}

