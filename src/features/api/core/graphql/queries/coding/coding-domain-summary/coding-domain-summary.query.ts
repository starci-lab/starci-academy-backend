import {
    ExecuteParams,
} from "../../../../types/execute"

/**
 * QueryBus payload for `codingDomainSummary`: the request context into
 * {@link CodingDomainSummaryHandler}. Constructed by the query service -- not injected.
 *
 * The request is `void` because the operation takes no arguments and no locale: the counts are a
 * fact about the catalog rather than about which translations exist, so the handler always reads
 * the English index. The params wrapper is kept anyway, because it is what carries the
 * authenticated user through the bus and it is the shape every other message in this app has.
 */
export class CodingDomainSummaryQuery {
    constructor(
        readonly params: ExecuteParams<void>,
    ) {}
}
