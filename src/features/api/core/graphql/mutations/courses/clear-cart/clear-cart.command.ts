import {
    ExecuteParams,
} from "@features/api/core/types"

/** CQRS command carrying the user context for the clearCart mutation (no request args). */
export class ClearCartCommand {
    constructor(
        readonly params: ExecuteParams<void>,
    ) {}
}
