import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SyncSubmissionCommand,
} from "./sync-submission.command"
import type {
    SyncSubmissionParams,
    SyncSubmissionResult,
} from "./types"

@Injectable()
export class SyncSubmissionService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: SyncSubmissionParams,
    ): Promise<SyncSubmissionResult> {
        return this.commandBus.execute(
            new SyncSubmissionCommand(params),
        )
    }
}
