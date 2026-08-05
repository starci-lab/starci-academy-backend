import {
    ExecuteParams,
} from "../../../../types"
import {
    StartTrialRequest,
} from "./graphql-types"

/** CQRS envelope for trial enrollment so idempotent placeholder creation stays in the handler. */
export class StartTrialCommand {
    constructor(
        readonly params: ExecuteParams<StartTrialRequest>,
    ) { }
}
