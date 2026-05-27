import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./authentication.module-definition"
import {
    ConnectGithubAccountSingleMutationModule,
} from "./connect-github-account"

@Module({
    imports: [
        ConnectGithubAccountSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class AuthenticationMutationsModule extends ConfigurableModuleClass {}
