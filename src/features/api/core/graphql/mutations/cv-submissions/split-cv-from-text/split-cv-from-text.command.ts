import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SplitCvFromTextRequest,
} from "./graphql-types"

export class SplitCvFromTextCommand {
    constructor(
        readonly params: ExecuteParams<SplitCvFromTextRequest>,
    ) { }
}
