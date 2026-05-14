import type {
    SyncPersonalProjectGithubParams,
} from "./types"

export class SyncPersonalProjectGithubCommand {
    constructor(
        readonly params: SyncPersonalProjectGithubParams,
    ) {}
}
