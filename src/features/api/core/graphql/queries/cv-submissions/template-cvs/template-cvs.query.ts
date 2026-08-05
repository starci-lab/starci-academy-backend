import {
    ExecuteParams 
} from "../../../../types"

/**
 * QueryBus payload for `templateCvs`: locale only (no request body) into
 * {@link TemplateCvsHandler}. Constructed by the query service — not injected.
 */
export class TemplateCvsQuery {
    constructor(
        readonly params: ExecuteParams<void>
    ) {}
}
