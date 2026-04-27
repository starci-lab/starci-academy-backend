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
    MarkAsReadedCommand,
} from "./mark-as-readed.command"
import {
    MarkAsReadedRequest,
    MarkAsReadedResponse,
} from "./graphql-types"

@Injectable()
export class MarkAsReadedService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<MarkAsReadedRequest>,
    ): Promise<MarkAsReadedResponse> {
        return this.commandBus.execute(
            new MarkAsReadedCommand(params),
        )
    }
}
