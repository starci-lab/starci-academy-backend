import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    AskContentAiRequest,
} from "./graphql-types"

/** CQRS command carrying the `askContentAi` mutation's request, user, and locale to {@link AskContentAiHandler}. */
export class AskContentAiCommand {
    constructor(
        readonly params: ExecuteParams<AskContentAiRequest>,
    ) { }
}
