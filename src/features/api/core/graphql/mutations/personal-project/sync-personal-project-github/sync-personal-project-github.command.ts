import {
    ExecuteParams,
} from "../../../../types"
import {
    SyncPersonalProjectGithubRequest,
} from "./graphql-types"

export class SyncPersonalProjectGithubCommand {
    constructor(
        readonly params: ExecuteParams<SyncPersonalProjectGithubRequest>,
    ) { }
}
