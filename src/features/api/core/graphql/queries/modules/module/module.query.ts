import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ModuleRequest,
} from "./graphql-types"

export class ModuleQuery {
    constructor(
        readonly params: ExecuteParams<ModuleRequest>,
    ) {}
}
