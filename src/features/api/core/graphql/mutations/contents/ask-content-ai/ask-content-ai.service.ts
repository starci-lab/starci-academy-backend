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

@Injectable()
export class AskContentAiService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<AskContentAiRequest>,
    ): Promise<AskContentAiData> {
        return this.commandBus.execute(
            new AskContentAiCommand(params),
        )
    }
}
