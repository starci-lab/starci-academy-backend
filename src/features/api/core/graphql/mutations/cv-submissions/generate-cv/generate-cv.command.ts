import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    GenerateCvRequest,
} from "./graphql-types"

/** CQRS envelope for enqueueing a generate-mode CV job. */
export class GenerateCvCommand {
    constructor(
        readonly params: ExecuteParams<GenerateCvRequest>,
    ) { }
}
