import {
    SubmitChallengeSubmissionParams,
} from "./types"

export class SubmitChallengeSubmissionCommand {
    constructor(
        readonly params: SubmitChallengeSubmissionParams,
    ) {}
}
