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
    TailorCvBlocksCommand,
} from "./tailor-cv-blocks.command"
import {
    TailorCvBlocksRequest,
    TailorCvBlocksData,
} from "./graphql-types"

@Injectable()
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
