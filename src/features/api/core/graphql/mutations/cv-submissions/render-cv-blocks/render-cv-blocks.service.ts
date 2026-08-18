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
    RenderCvBlocksCommand,
} from "./render-cv-blocks.command"
import {
    RenderCvBlocksRequest,
} from "./graphql-types/request"
import {
    RenderCvBlocksResponseData,
} from "./graphql-types/response"

@Injectable()
/** CommandBus hop so the resolver does not import the renderer. */
export class RenderCvBlocksService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<RenderCvBlocksRequest>,
    ): Promise<RenderCvBlocksResponseData> {
        return this.commandBus.execute(
            new RenderCvBlocksCommand(params),
        )
    }
}
