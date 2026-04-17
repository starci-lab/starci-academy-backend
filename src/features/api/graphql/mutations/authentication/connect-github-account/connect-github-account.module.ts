import {
    Module,
} from "@nestjs/common"
import {
    ConnectGithubAccountService,
} from "./connect-github-account.service"
import {
    ConnectGithubAccountResolver,
} from "./connect-github-account.resolver"

@Module({
    providers: [
        ConnectGithubAccountService,
        ConnectGithubAccountResolver,
    ],
})
export class ConnectGithubAccountMutationModule {}
