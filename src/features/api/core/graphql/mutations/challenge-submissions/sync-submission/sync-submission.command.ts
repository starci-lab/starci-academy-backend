import {
    SyncSubmissionParams,
} from "./types"

export class SyncSubmissionCommand {
    constructor(
        readonly params: SyncSubmissionParams,
    ) {}
}
