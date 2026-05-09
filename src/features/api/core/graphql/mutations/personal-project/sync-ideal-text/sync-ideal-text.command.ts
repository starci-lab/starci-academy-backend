import {
    ExecuteParams,
} from "../../../../types"
import {
    SyncIdealTextRequest,
} from "./graphql-types"

export class SyncIdealTextCommand {
    constructor(
        readonly params: ExecuteParams<SyncIdealTextRequest>,
    ) { }
}
