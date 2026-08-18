import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    MarkAsReadedCommand,
} from "./mark-as-readed.command"
import {
    MarkAsReadedRequest,
} from "./graphql-types/request"
import {
    MarkAsReadedResponse as MarkAsReadedResult,
} from "./graphql-types/response"

@Injectable()
/** CommandBus hop so the resolver never imports the handler or persistence. */
export class MarkAsReadedService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<MarkAsReadedRequest>,
    ): Promise<MarkAsReadedResult> {
        return this.commandBus.execute(
            new MarkAsReadedCommand(params),
        )
    }
}
