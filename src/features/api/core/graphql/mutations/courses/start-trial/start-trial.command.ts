import {
    ExecuteParams,
} from "../../../../types"
import {
    StartTrialRequest,
} from "./graphql-types"

export class StartTrialCommand {
    constructor(
        readonly params: ExecuteParams<StartTrialRequest>,
    ) { }
}
