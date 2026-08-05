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
    CreateCvBlocksCommand,
} from "./create-cv-blocks.command"
import {
    CreateCvBlocksRequest,
} from "./graphql-types/request"
import type {
    CvBlocksDocument,
} from "../../../queries/cv-submissions/my-cv-blocks/graphql-types/response"

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
