import {
    ExecuteParams,
} from "../../../../types/execute"

/** CQRS command carrying the user context for the clearCart mutation (no request args). */
export class ClearCartCommand {
    constructor(
        readonly params: ExecuteParams<void>,
    ) {}
}
