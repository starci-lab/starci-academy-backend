import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SubmitChallengeSubmissionCommand,
} from "./submit-challenge-submission.command"
import {
    SubmitChallengeSubmissionParams,
    SubmitChallengeSubmissionResult,
} from "./types/submit-challenge-submission"

@Injectable()
/**
 * Thin command-bus hop so the GraphQL leaf never talks to the job queue or
 * the credit pool directly.
 */
export class SubmitChallengeSubmissionService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: SubmitChallengeSubmissionParams,
    ): Promise<SubmitChallengeSubmissionResult> {
        return this.commandBus.execute(
            new SubmitChallengeSubmissionCommand(params),
        )
    }
}
