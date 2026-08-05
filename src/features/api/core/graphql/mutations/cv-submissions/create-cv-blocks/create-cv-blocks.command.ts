import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CreateCvBlocksRequest,
} from "./graphql-types/request"

/** CQRS envelope for persisting a new editor-owned CV document. */
export class CreateCvBlocksCommand {
    constructor(
        readonly params: ExecuteParams<CreateCvBlocksRequest>,
    ) { }
}
