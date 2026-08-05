import {
    ConfigurableModuleClass,
} from "./connect-github-account.module-definition"
import {
    Module,
} from "@nestjs/common"
import {
    ConnectGithubAccountResolver,
} from "./connect-github-account.resolver"
import {
    ConnectGithubAccountService,
} from "./connect-github-account.service"
import {
    ConnectGithubAccountHandler,
} from "./connect-github-account.handler"

@Module({
    providers: [
        ConnectGithubAccountService,
        ConnectGithubAccountResolver,
        ConnectGithubAccountHandler,
    ],
})
/**
 * Registers resolver + service + handler so GitHub linking cannot be imported
 * without its Octokit verification path.
 */
export class ConnectGithubAccountSingleMutationModule extends ConfigurableModuleClass {}
