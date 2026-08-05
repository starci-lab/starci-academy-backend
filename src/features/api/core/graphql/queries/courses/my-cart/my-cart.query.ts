import {
    ExecuteParams,
} from "../../../../types/execute"

/** CQRS query carrying the user context for the myCart query (no request args). */
export class MyCartQuery {
    constructor(
        readonly params: ExecuteParams<void>,
    ) {}
}
