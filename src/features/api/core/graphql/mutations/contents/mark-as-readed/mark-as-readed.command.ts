import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    MarkAsReadedRequest,
} from "./graphql-types/request"

/** CQRS envelope so XP, activity, and progress side effects run in the handler rather than the resolver. */
export class MarkAsReadedCommand {
    constructor(
        readonly params: ExecuteParams<MarkAsReadedRequest>,
    ) {}
}
