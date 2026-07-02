import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    GenerateCvRequest,
} from "./graphql-types"

export class GenerateCvCommand {
    constructor(
        readonly params: ExecuteParams<GenerateCvRequest>,
    ) { }
}
