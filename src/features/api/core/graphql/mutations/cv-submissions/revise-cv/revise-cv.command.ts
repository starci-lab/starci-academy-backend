import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ReviseCvRequest,
} from "./graphql-types/request"

/** CQRS envelope for enqueueing a revision against an owned generation. */
export class ReviseCvCommand {
    constructor(
        readonly params: ExecuteParams<ReviseCvRequest>,
    ) { }
}
