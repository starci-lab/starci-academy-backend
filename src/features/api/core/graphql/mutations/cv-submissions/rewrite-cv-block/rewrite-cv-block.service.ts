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
    RewriteCvBlockCommand,
} from "./rewrite-cv-block.command"
import {
    RewriteCvBlockRequest,
} from "./graphql-types/request"
import {
    RewriteCvBlockData,
} from "./graphql-types/response"

@Injectable()
/** CommandBus hop so the resolver does not import AI clients. */
export class RewriteCvBlockService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<RewriteCvBlockRequest>,
    ): Promise<RewriteCvBlockData> {
        return this.commandBus.execute(
            new RewriteCvBlockCommand(params),
        )
    }
}
