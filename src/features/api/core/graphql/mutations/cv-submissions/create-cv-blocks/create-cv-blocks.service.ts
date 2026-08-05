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
    CreateCvBlocksCommand,
} from "./create-cv-blocks.command"
import {
    CreateCvBlocksRequest,
} from "./graphql-types"
import type {
    CvBlocksDocument,
} from "./graphql-types"

@Injectable()
/** CommandBus hop so the resolver does not import persistence. */
export class CreateCvBlocksService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<CreateCvBlocksRequest>,
    ): Promise<CvBlocksDocument> {
        return this.commandBus.execute(
            new CreateCvBlocksCommand(params),
        )
    }
}
