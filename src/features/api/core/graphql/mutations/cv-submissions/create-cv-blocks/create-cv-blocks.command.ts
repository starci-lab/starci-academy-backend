import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CreateCvBlocksRequest,
} from "./graphql-types"

/** CQRS envelope for persisting a new editor-owned CV document. */
export class CreateCvBlocksCommand {
    constructor(
        readonly params: ExecuteParams<CreateCvBlocksRequest>,
    ) { }
}
