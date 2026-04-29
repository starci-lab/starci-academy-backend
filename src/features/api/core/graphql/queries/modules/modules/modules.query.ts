import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ModulesRequest,
} from "./graphql-types"

export class ModulesQuery {
    constructor(
        readonly params: ExecuteParams<ModulesRequest>,
    ) {}
}
