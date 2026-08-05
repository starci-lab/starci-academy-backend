import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    TailorCvBlocksRequest,
} from "./graphql-types/request"

/** CQRS envelope for JD-aligning block wording in memory. */
export class TailorCvBlocksCommand {
    constructor(
        readonly params: ExecuteParams<TailorCvBlocksRequest>,
    ) { }
}
