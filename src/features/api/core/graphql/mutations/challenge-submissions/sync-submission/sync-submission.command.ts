import {
    SyncSubmissionParams,
} from "./types"

/**
 * CQRS envelope for the draft-save path -- kept distinct from submit so a
 * URL sync cannot accidentally enqueue grading.
 */
export class SyncSubmissionCommand {
    constructor(
        readonly params: SyncSubmissionParams,
    ) {}
}
