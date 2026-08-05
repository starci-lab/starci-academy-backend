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
    RenderCvBlocksCommand,
} from "./render-cv-blocks.command"
import {
    RenderCvBlocksRequest,
    RenderCvBlocksResult,
} from "./graphql-types"

@Injectable()
/** CommandBus hop so the resolver does not import the renderer. */
export class RenderCvBlocksService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<RenderCvBlocksRequest>,
    ): Promise<RenderCvBlocksResult> {
        return this.commandBus.execute(
            new RenderCvBlocksCommand(params),
        )
    }
}
