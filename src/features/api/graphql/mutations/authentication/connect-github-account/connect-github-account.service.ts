import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    UserEntity,
} from "@modules/databases"
import {
    ConnectGithubAccountCommand,
} from "./connect-github-account.command"
import {
    ConnectGithubAccountInput,
} from "./graphql-types"

@Injectable()
export class ConnectGithubAccountService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        user: UserEntity,
        input: ConnectGithubAccountInput,
    ): Promise<UserEntity> {
        return this.commandBus.execute(
            new ConnectGithubAccountCommand({
                user,
                input,
            }),
        )
    }
}
