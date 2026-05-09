import {
    ExecuteParams,
} from "../../../../types"
import {
    SubmitPersonalProjectIdealRequest,
} from "./graphql-types"

export class SubmitPersonalProjectIdealCommand {
    constructor(
        readonly params: ExecuteParams<SubmitPersonalProjectIdealRequest>,
    ) { }
}
