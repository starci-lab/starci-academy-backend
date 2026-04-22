import {
    ExecuteParams,
} from "@features/api/types"
import {
    MarkAsReadedRequest,
} from "./graphql-types"

export class MarkAsReadedCommand {
    constructor(
        readonly params: ExecuteParams<MarkAsReadedRequest>,
    ) {}
}
