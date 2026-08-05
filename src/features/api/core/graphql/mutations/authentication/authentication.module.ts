import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./authentication.module-definition"
import {
    ConnectGithubAccountSingleMutationModule,
} from "./connect-github-account/connect-github-account.module"

@Module({
    imports: [
        ConnectGithubAccountSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Authentication write-side group. Today only GitHub account linking -- kept
 * separate so later auth mutations do not land in the root MutationsModule.
 */
export class AuthenticationMutationsModule extends ConfigurableModuleClass {}
