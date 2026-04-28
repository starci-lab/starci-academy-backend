import {
    ExecuteParams,
} from "../../../../types"
import {
    MarkAsReadedRequest,
} from "./graphql-types"

export class MarkAsReadedCommand {
    constructor(
        readonly params: ExecuteParams<MarkAsReadedRequest>,
    ) {}
}
