import {
    ICqrsHandler,
    EventBus,
    EnqueueInviteGithubJobService,
} from "@modules/bussiness"
import {
    EnrollmentEntity,
    UserEntity,
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import {
    MountStorageService,
} from "@modules/filesystem"
import {
    Octokit,
} from "octokit"
import {
    GithubUserNotFoundException,
    GithubUserVerificationFailedException,
} from "@modules/exceptions"
import {
    ConnectGithubAccountCommand,
} from "./connect-github-account.command"

export class ConnectGithubAccountHandler extends ICqrsHandler<UserEntity> {
    constructor(
        private readonly command: ConnectGithubAccountCommand,
        private readonly entityManager: EntityManager,
        private readonly mountStorageService: MountStorageService,
        private readonly enqueueInviteGithubJobService: EnqueueInviteGithubJobService,
        private readonly eventBus: EventBus,
    ) {
        super()
    }

    protected async process(): Promise<UserEntity> {
        const {
            user,
            input: {
                githubUsername,
            },
        } = this.command

        const octokit = new Octokit({
            auth: this.mountStorageService.githubAccessToken,
        })

        try {
            await octokit.rest.users.getByUsername({
                username: githubUsername,
            })
        } catch (error) {
            if (error instanceof Error && error.message.includes("404")) {
                throw new GithubUserNotFoundException(
                    {
                        githubUsername,
                        originalError: error,
                    },
                )
            }
            throw new GithubUserVerificationFailedException(
                {
                    githubUsername,
                    originalError: error instanceof Error ? error : undefined,
                },
            )
        }

        user.githubUsername = githubUsername
        await this.entityManager.save(user)

        return user
    }

    protected async emit(): Promise<void> {
        const {
            user,
            input: {
                githubUsername,
            },
        } = this.command

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

        for (const enrollment of enrollments) {
            await this.eventBus.execute(
                {
                    name: `connect-github-account.invite.${user.id}.${enrollment.courseId}`,
                    execute: async () => {
                        await this.enqueueInviteGithubJobService.enqueue(
                            {
                                userId: user.id,
                                courseId: enrollment.courseId,
                                githubUsername,
                            },
                        )
                    },
                },
            )
        }
    }
}
