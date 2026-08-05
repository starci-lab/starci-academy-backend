import {
    ExecuteParams,
} from "../../../../types"
import {
    SubmitPersonalGithubUrlRequest,
} from "./graphql-types"

/**
 * CQRS envelope for the first-time GitHub URL bind on an enrollment.
 */
export class SubmitPersonalGithubUrlCommand {
    constructor(
        readonly params: ExecuteParams<SubmitPersonalGithubUrlRequest>,
    ) { }
}
