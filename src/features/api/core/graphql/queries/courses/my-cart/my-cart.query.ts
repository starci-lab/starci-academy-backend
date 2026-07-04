import {
    ExecuteParams,
} from "@features/api/core/types"

/** CQRS query carrying the user context for the myCart query (no request args). */
export class MyCartQuery {
    constructor(
        readonly params: ExecuteParams<void>,
    ) {}
}
