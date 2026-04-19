import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SubmitChallengeSubmissionsCommand,
} from "./submit-challenge-submissions.command"
import {
    SubmitChallengeSubmissionsParams,
} from "./types"

@Injectable()
export class SubmitChallengeSubmissionsService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: SubmitChallengeSubmissionsParams,
    ): Promise<void> {
        await this.commandBus.execute(
            new SubmitChallengeSubmissionsCommand(params),
        )
    }
}
