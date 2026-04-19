import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
    EventBus,
    EnqueueInviteGithubJobService,
} from "@modules/bussiness"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import {
    MountStorageService,
} from "@modules/filesystem"
import {
    ConnectGithubAccountInput,
} from "@features/api/graphql/mutations/authentication/connect-github-account/graphql-types"
import {
    ConnectGithubAccountCommand,
} from "./connect-github-account.command"
import {
    ConnectGithubAccountHandler,
} from "./connect-github-account.handler"

@Injectable()
export class ConnectGithubAccountService {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly eventBus: EventBus,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly mountStorageService: MountStorageService,
        private readonly enqueueInviteGithubJobService: EnqueueInviteGithubJobService,
    ) {}

    async execute(
        user: UserEntity,
        input: ConnectGithubAccountInput,
    ): Promise<UserEntity> {
        const command = new ConnectGithubAccountCommand(
            user,
            input,
        )

        return this.commandBus.execute(
            new ConnectGithubAccountHandler(
                command,
                this.entityManager,
                this.mountStorageService,
                this.enqueueInviteGithubJobService,
                this.eventBus,
            ),
        )
    }
}
