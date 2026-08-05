import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    RenderCvBlocksRequest,
} from "./graphql-types/request"

/** CQRS envelope for exporting editor blocks to a downloadable file. */
export class RenderCvBlocksCommand {
    constructor(
        readonly params: ExecuteParams<RenderCvBlocksRequest>,
    ) { }
}
