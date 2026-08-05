import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    StartTrialRequest,
} from "./graphql-types/request"

/** CQRS envelope for trial enrollment so idempotent placeholder creation stays in the handler. */
export class StartTrialCommand {
    constructor(
        readonly params: ExecuteParams<StartTrialRequest>,
    ) { }
}
