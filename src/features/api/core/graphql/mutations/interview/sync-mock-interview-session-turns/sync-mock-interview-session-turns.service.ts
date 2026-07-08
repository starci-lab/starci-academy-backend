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
    SyncMockInterviewSessionTurnsCommand,
} from "./sync-mock-interview-session-turns.command"
import {
    SyncMockInterviewSessionTurnsRequest,
    SyncMockInterviewSessionTurnsData,
} from "./graphql-types"

@Injectable()
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
