import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    StartMockInterviewSessionCommand,
} from "./start-mock-interview-session.command"
import {
    StartMockInterviewSessionRequest,
    StartMockInterviewSessionData,
} from "./graphql-types"

@Injectable()
/** Forwards the start-session request to the command bus so the resolver stays a thin leaf. */
export class StartMockInterviewSessionService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<StartMockInterviewSessionRequest>,
    ): Promise<StartMockInterviewSessionData> {
        return this.commandBus.execute(
            new StartMockInterviewSessionCommand(params),
        )
    }
}
