import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    TriggerCvSubmissionCommand,
    TriggerCvSubmissionCommandParams,
} from "./trigger-cv-submission.command"
import {
    TriggerCvSubmissionResponse,
} from "./graphql-types"

@Injectable()
export class TriggerCvSubmissionService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: TriggerCvSubmissionCommandParams,
    ): Promise<TriggerCvSubmissionResponse> {
        return this.commandBus.execute(
            new TriggerCvSubmissionCommand(params),
        )
    }
}
