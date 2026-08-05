import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    CreatePlaygroundSessionRequest,
} from "./graphql-types"

/**
 * CQRS envelope for starting a playground run — pairing-code mint and
 * free-mode hint redaction stay in the handler.
 */
export class CreatePlaygroundSessionCommand {
    constructor(
        readonly params: ExecuteParams<CreatePlaygroundSessionRequest>,
    ) {}
}
