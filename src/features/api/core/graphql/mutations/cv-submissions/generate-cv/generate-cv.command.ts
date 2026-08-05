import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    GenerateCvRequest,
} from "./graphql-types/request"

/** CQRS envelope for enqueueing a generate-mode CV job. */
export class GenerateCvCommand {
    constructor(
        readonly params: ExecuteParams<GenerateCvRequest>,
    ) { }
}
