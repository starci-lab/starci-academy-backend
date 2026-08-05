import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CreatePlaygroundSessionRequest,
} from "./graphql-types/request"

/**
 * CQRS envelope for starting a playground run -- pairing-code mint and
 * free-mode hint redaction stay in the handler.
 */
export class CreatePlaygroundSessionCommand {
    constructor(
        readonly params: ExecuteParams<CreatePlaygroundSessionRequest>,
    ) {}
}
