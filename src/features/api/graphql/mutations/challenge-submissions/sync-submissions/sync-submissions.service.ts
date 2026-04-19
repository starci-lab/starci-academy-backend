import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SyncSubmissionsCommand,
} from "./sync-submissions.command"
import type {
    SyncSubmissionsParams,
    SyncSubmissionsResult,
} from "./types"

@Injectable()
export class SyncSubmissionsService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: SyncSubmissionsParams,
    ): Promise<SyncSubmissionsResult> {
        return this.commandBus.execute(
            new SyncSubmissionsCommand(params),
        )
    }
}
