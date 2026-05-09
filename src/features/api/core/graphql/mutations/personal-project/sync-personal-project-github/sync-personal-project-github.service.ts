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
    SyncPersonalProjectGithubCommand,
} from "./sync-personal-project-github.command"
import type {
    SyncPersonalProjectGithubRequest,
} from "./graphql-types"

@Injectable()
export class SyncPersonalProjectGithubService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: ExecuteParams<SyncPersonalProjectGithubRequest>,
    ): Promise<EnrollmentEntity> {
        return this.commandBus.execute(
            new SyncPersonalProjectGithubCommand(params),
        )
    }
}
