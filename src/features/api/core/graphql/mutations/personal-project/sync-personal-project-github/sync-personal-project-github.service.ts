import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    SyncPersonalProjectGithubCommand,
} from "./sync-personal-project-github.command"
import type {
    SyncPersonalProjectGithubParams,
    SyncPersonalProjectGithubResult,
} from "./types/sync-personal-project-github"

@Injectable()
/**
 * Thin command-bus hop for the enrollment GitHub patch.
 */
export class SyncPersonalProjectGithubService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: SyncPersonalProjectGithubParams,
    ): Promise<SyncPersonalProjectGithubResult> {
        return this.commandBus.execute(
            new SyncPersonalProjectGithubCommand(params),
        )
    }
}
