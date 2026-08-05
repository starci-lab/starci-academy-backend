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
    DeleteCvBlocksCommand,
} from "./delete-cv-blocks.command"
import {
    DeleteCvBlocksRequest,
} from "./graphql-types/request"
import type {
    DeleteCvBlocksData,
} from "./graphql-types/response"

@Injectable()
/** CommandBus hop so the resolver stays persistence-free. */
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
