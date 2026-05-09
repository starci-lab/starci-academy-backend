import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    EnrollmentEntity,
} from "@modules/databases"
import {
    SyncIdealTextCommand,
} from "./sync-ideal-text.command"
import type {
    SyncIdealTextRequest,
} from "./graphql-types"

@Injectable()
export class SyncIdealTextService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<SyncIdealTextRequest>,
    ): Promise<EnrollmentEntity> {
        return this.commandBus.execute(
            new SyncIdealTextCommand(params),
        )
    }
}
