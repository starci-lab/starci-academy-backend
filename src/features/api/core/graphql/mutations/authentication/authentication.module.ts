import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./authentication.module-definition"
import {
    ConnectGithubAccountMutationModule,
} from "./connect-github-account"

@Module({
    imports: [
        ConnectGithubAccountMutationModule,
    ],
})
export class AuthenticationMutationsModule extends ConfigurableModuleClass {}
