import {
    SubmitChallengeSubmissionParams,
} from "./types/submit-challenge-submission"

/**
 * CQRS envelope for enqueue-grading -- quota, premium lock, and job dispatch
 * stay in the handler so the resolver cannot accidentally skip them.
 */
export class SubmitChallengeSubmissionCommand {
    constructor(
        readonly params: SubmitChallengeSubmissionParams,
    ) {}
}
