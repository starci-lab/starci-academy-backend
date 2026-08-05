import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CvGenerationRequest,
} from "./graphql-types/request"

/**
 * QueryBus payload for `cvGeneration`: request + locale + user into
 * {@link CvGenerationHandler}. Constructed by the query service -- not injected.
 */
export class CvGenerationQuery {
    constructor(
        readonly params: ExecuteParams<CvGenerationRequest>,
    ) { }
}
