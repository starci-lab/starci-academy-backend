import type {
    SyncPersonalProjectGithubParams,
} from "./types/sync-personal-project-github"

/**
 * CQRS envelope for the enrollment GitHub patch -- kept off submit-url so
 * token / branch edits never share that leaf's required-URL contract.
 */
export class SyncPersonalProjectGithubCommand {
    constructor(
        readonly params: SyncPersonalProjectGithubParams,
    ) {}
}
