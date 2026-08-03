import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    AskContentAiCommand,
} from "./ask-content-ai.command"
import {
    AskContentAiData,
    AskContentAiRequest,
} from "./graphql-types"

/**
 * Thin CQRS-dispatch shim for the `askContentAi` mutation: wraps the
 * resolver's params in {@link AskContentAiCommand} and dispatches it to
 * {@link AskContentAiHandler} via the command bus.
 */
@Injectable()
export class AskContentAiService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    /**
     * @param params - The request, the asking user, and the locale.
     * @returns The model's answer.
     */
    async execute(
        params: ExecuteParams<AskContentAiRequest>,
    ): Promise<AskContentAiData> {
        return this.commandBus.execute(
            new AskContentAiCommand(params),
        )
    }
}
