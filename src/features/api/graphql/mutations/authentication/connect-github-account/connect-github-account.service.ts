import {
    Injectable,
} from "@nestjs/common"
import {
    Octokit,
} from "octokit"
import {
    InjectPrimaryPostgreSQLEntityManager,
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
    ConnectGithubAccountInput,
} from "./graphql-types"
import {
    EnqueueInviteGithubJobService 
} from "@modules/bussiness"
import {
    GithubUserNotFoundException,
    GithubUserVerificationFailedException,
} from "@modules/exceptions"

/**
 * Service for connecting a GitHub account to a user.
 */
@Injectable()
export class ConnectGithubAccountService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly mountStorageService: MountStorageService,
        private readonly enqueueInviteGithubJobService: EnqueueInviteGithubJobService,
    ) {}

    /**
     * Verify GitHub username exists and update user entity.
     * @param user - Current authenticated user
     * @param input - Input containing GitHub username
     * @returns Updated user entity
     */
    async execute(
        user: UserEntity,
        input: ConnectGithubAccountInput,
    ): Promise<UserEntity> {
        const { githubUsername } = input

        // Initialize Octokit with GitHub token from mounted secret
        const octokit = new Octokit({
            auth: this.mountStorageService.githubAccessToken,
        })

        try {
            // Verify the GitHub username exists
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

        // Update user with GitHub username
        user.githubUsername = githubUsername
        await this.entityManager.save(user)

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
            try {
                await this.enqueueInviteGithubJobService.enqueue({
                    userId: user.id,
                    courseId: enrollment.courseId,
                    githubUsername,
                })
            } catch (error) {
                console.error(error)
            }
        }

        return user
    }
}
