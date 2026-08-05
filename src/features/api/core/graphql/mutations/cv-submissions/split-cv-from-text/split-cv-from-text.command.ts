import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    SplitCvFromTextRequest,
} from "./graphql-types/request"

/** CQRS envelope for parsing pasted text into editor blocks. */
export class SplitCvFromTextCommand {
    constructor(
        readonly params: ExecuteParams<SplitCvFromTextRequest>,
    ) { }
}
