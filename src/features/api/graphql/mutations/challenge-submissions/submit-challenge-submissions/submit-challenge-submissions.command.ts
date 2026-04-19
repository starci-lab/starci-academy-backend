import {
    SubmitChallengeSubmissionsParams,
} from "./types"

export class SubmitChallengeSubmissionsCommand {
    constructor(
        readonly params: SubmitChallengeSubmissionsParams,
    ) {}
}
