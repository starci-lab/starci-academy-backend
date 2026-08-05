import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ModulesRequest,
} from "./graphql-types"

/** CQRS message that lists every module in a course. */
export class ModulesQuery {
    constructor(
        readonly params: ExecuteParams<ModulesRequest>,
    ) {}
}
