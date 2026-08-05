import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ReviseCvRequest,
} from "./graphql-types"

/** CQRS envelope for enqueueing a revision against an owned generation. */
export class ReviseCvCommand {
    constructor(
        readonly params: ExecuteParams<ReviseCvRequest>,
    ) { }
}
