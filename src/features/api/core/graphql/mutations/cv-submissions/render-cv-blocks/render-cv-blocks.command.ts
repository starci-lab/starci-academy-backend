import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    RenderCvBlocksRequest,
} from "./graphql-types"

/** CQRS envelope for exporting editor blocks to a downloadable file. */
export class RenderCvBlocksCommand {
    constructor(
        readonly params: ExecuteParams<RenderCvBlocksRequest>,
    ) { }
}
