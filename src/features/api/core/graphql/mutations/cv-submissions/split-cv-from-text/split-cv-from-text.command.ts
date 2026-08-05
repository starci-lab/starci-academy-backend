import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SplitCvFromTextRequest,
} from "./graphql-types"

/** CQRS envelope for parsing pasted text into editor blocks. */
export class SplitCvFromTextCommand {
    constructor(
        readonly params: ExecuteParams<SplitCvFromTextRequest>,
    ) { }
}
