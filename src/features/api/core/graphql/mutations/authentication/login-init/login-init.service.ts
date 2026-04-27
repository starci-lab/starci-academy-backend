import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import type {
    Locale,
} from "@modules/databases"
import type {
    LoginInitData,
    LoginInitInput,
} from "./graphql-types"
import {
    LoginInitCommand,
} from "./login-init.command"

@Injectable()
export class LoginInitService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        input: LoginInitInput,
        locale: Locale,
    ): Promise<LoginInitData> {
        return this.commandBus.execute(
            new LoginInitCommand({
                input,
                locale,
            }),
        )
    }
}

