import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ModuleRequest,
} from "./graphql-types/request"

/** CQRS message that loads one module by id or display id. */
export class ModuleQuery {
    constructor(
        readonly params: ExecuteParams<ModuleRequest>,
    ) {}
}
