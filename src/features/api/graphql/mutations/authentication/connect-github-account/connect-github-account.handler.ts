import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    AddGithubUserToTeamEventHandler,
} from "@modules/cqrs"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    GithubUserNotFoundException,
    GithubUserVerificationFailedException,
} from "@modules/exceptions"
import {
    MountStorageService,
} from "@modules/filesystem"
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

    protected override async emit(
        command: ConnectGithubAccountCommand,
    ): Promise<void> {
        const {
            user,
            input: {
                githubUsername,
            },
        } = command.params

        const enrollments = await this.entityManager.find(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                },
            },
        )

        // for (const enrollment of enrollments) {
        //     await this.addGithubUserToTeamEventHandler.publish({
        //         userId: user.id,
        //         courseId: enrollment.courseId,
        //         githubUsername,
        //     })
        // }
    }
}
