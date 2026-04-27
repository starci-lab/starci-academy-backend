import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    MarkAsReadedRequest,
} from "./graphql-types"

export class MarkAsReadedCommand {
    constructor(
        readonly params: ExecuteParams<MarkAsReadedRequest>,
    ) {}
}
