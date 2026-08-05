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
    TailorCvBlocksCommand,
} from "./tailor-cv-blocks.command"
import {
    TailorCvBlocksRequest,
} from "./graphql-types/request"
import {
    TailorCvBlocksData,
} from "./graphql-types/response"

@Injectable()
/** CommandBus hop so the resolver does not import AI clients. */
export class TailorCvBlocksService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<TailorCvBlocksRequest>,
    ): Promise<TailorCvBlocksData> {
        return this.commandBus.execute(
            new TailorCvBlocksCommand(params),
        )
    }
}
