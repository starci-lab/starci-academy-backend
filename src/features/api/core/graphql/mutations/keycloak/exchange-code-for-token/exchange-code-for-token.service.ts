import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import type {
    ExchangeCodeForTokenCommandResult,
    ExchangeCodeForTokenRequest,
} from "./graphql-types"
import {
    ExchangeCodeForTokenCommand,
} from "./exchange-code-for-token.command"

@Injectable()
/** Forwards the OIDC code exchange to the command bus so the resolver can focus on cookies. */
export class ExchangeCodeForTokenService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        request: ExchangeCodeForTokenRequest,
    ): Promise<ExchangeCodeForTokenCommandResult> {
        const result = await this.commandBus.execute(
            new ExchangeCodeForTokenCommand({
                request,
            }),
        )
        return result
    }
}

