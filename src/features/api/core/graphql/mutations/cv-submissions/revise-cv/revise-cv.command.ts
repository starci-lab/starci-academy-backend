import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ReviseCvRequest,
} from "./graphql-types"

export class ReviseCvCommand {
    constructor(
        readonly params: ExecuteParams<ReviseCvRequest>,
    ) { }
}
