import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    SubmitPersonalGithubUrlRequest,
} from "./graphql-types/request"

/**
 * CQRS envelope for the first-time GitHub URL bind on an enrollment.
 */
export class SubmitPersonalGithubUrlCommand {
    constructor(
        readonly params: ExecuteParams<SubmitPersonalGithubUrlRequest>,
    ) { }
}
