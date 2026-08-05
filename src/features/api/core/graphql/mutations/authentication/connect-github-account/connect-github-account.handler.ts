import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    GithubUserNotFoundException,
    GithubUserVerificationFailedException,
} from "@modules/platform/exceptions/errors/users/github"
import {
    MountStorageService,
} from "@modules/filesystem/mount-storage.service"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    Octokit,
} from "octokit"
import {
    EntityManager,
} from "typeorm"
import {
    ConnectGithubAccountCommand,
} from "./connect-github-account.command"

@CommandHandler(ConnectGithubAccountCommand)
@Injectable()
/**
 * Verifies the GitHub login exists via Octokit before persisting it -- a
 * typo'd username would otherwise break later team-invite / clone jobs.
 */
export class ConnectGithubAccountHandler
    extends ICQRSHandler<ConnectGithubAccountCommand, UserEntity>
    implements ICommandHandler<ConnectGithubAccountCommand, UserEntity> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly mountStorageService: MountStorageService,
    ) {
        super()
    }

    protected override async process(
        command: ConnectGithubAccountCommand,
    ): Promise<UserEntity> {
        const {
            user,
            input: {
                githubUsername,
            },
        } = command.params

        const octokit = new Octokit({
            auth: this.mountStorageService.githubAccessToken,
        })

        try {
            await octokit.rest.users.getByUsername({
                username: githubUsername,
            })
        } catch (error) {
            if (error instanceof Error && error.message.includes("404")) {
                throw new GithubUserNotFoundException({
                    githubUsername,
                    originalError: error,
                })
            }
            throw new GithubUserVerificationFailedException({
                githubUsername,
                originalError: error instanceof Error ? error : undefined,
            })
        }

        user.githubUsername = githubUsername
        await this.entityManager.save(user)

        return user
    }
}
