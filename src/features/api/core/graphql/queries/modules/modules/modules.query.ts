import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ModulesRequest,
} from "./graphql-types/request"

/** CQRS message that lists every module in a course. */
export class ModulesQuery {
    constructor(
        readonly params: ExecuteParams<ModulesRequest>,
    ) {}
}
