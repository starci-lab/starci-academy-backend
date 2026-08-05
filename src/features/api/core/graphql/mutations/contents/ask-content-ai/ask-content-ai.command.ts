import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    AskContentAiRequest,
} from "./graphql-types/request"

/** CQRS command carrying the `askContentAi` mutation's request, user, and locale to {@link AskContentAiHandler}. */
export class AskContentAiCommand {
    constructor(
        readonly params: ExecuteParams<AskContentAiRequest>,
    ) { }
}
