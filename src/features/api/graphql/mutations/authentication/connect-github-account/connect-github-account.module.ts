import {
    Module,
} from "@nestjs/common"
import {
    ConnectGithubAccountService,
} from "@features/api/cqrs"
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
