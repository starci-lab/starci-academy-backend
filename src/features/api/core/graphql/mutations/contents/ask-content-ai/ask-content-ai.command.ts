import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    AskContentAiRequest,
} from "./graphql-types"

export class AskContentAiCommand {
    constructor(
        readonly params: ExecuteParams<AskContentAiRequest>,
    ) { }
}
