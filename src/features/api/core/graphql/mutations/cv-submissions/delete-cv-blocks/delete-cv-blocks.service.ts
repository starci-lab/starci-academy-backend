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
    DeleteCvBlocksCommand,
} from "./delete-cv-blocks.command"
import {
    DeleteCvBlocksRequest,
} from "./graphql-types"
import type {
    DeleteCvBlocksData,
} from "./graphql-types"

@Injectable()
export class DeleteCvBlocksService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<DeleteCvBlocksRequest>,
    ): Promise<DeleteCvBlocksData> {
        return this.commandBus.execute(
            new DeleteCvBlocksCommand(params),
        )
    }
}
