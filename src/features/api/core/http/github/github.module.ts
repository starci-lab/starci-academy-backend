import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./github.module-definition"
import {
    GithubOauthModule,
} from "./oauth/oauth.module"

@Module({
    imports: [
        GithubOauthModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Module for GitHub.
 */
export class GithubModule extends ConfigurableModuleClass {}

