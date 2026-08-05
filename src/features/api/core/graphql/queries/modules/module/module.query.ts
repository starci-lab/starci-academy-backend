import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ModuleRequest,
} from "./graphql-types"

/** CQRS message that loads one module by id or display id. */
export class ModuleQuery {
    constructor(
        readonly params: ExecuteParams<ModuleRequest>,
    ) {}
}
