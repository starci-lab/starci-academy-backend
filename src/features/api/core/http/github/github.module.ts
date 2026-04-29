import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./github.module-definition"
import {
    GithubOauthModule,
} from "./oauth"

/**
 * Module for GitHub.
 */
@Module({
    imports: [
        GithubOauthModule.register({
            isGlobal: true,
        }),
    ],
})
export class GithubModule extends ConfigurableModuleClass {}

