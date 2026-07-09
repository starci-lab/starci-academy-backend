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
    UpdateCvBlocksCommand,
} from "./update-cv-blocks.command"
import {
    UpdateCvBlocksRequest,
} from "./graphql-types"
import type {
    CvBlocksDocument,
} from "./graphql-types"

@Injectable()
export class UpdateCvBlocksService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<UpdateCvBlocksRequest>,
    ): Promise<CvBlocksDocument> {
        return this.commandBus.execute(
            new UpdateCvBlocksCommand(params),
        )
    }
}
