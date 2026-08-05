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
    UpdateCvBlocksCommand,
} from "./update-cv-blocks.command"
import {
    UpdateCvBlocksRequest,
} from "./graphql-types/request"
import type {
    CvBlocksDocument,
} from "../../../queries/cv-submissions/my-cv-blocks/graphql-types/response"

@Injectable()
/** CommandBus hop so the resolver stays persistence-free. */
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
