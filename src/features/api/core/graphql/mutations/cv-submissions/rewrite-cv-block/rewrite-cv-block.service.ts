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
    RewriteCvBlockCommand,
} from "./rewrite-cv-block.command"
import {
    RewriteCvBlockRequest,
    RewriteCvBlockData,
} from "./graphql-types"

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
