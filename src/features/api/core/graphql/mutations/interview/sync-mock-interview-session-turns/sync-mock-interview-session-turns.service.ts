import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SyncMockInterviewSessionTurnsCommand,
} from "./sync-mock-interview-session-turns.command"
import {
    SyncMockInterviewSessionTurnsRequest,
} from "./graphql-types/request"
import {
    SyncMockInterviewSessionTurnsData,
} from "./graphql-types/response"

@Injectable()
/** Forwards transcript sync to the command bus so the resolver stays a thin leaf. */
export class SyncMockInterviewSessionTurnsService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<SyncMockInterviewSessionTurnsRequest>,
    ): Promise<SyncMockInterviewSessionTurnsData> {
        return this.commandBus.execute(
            new SyncMockInterviewSessionTurnsCommand(params),
        )
    }
}
