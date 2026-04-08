import {
    ChallengeEntity,
    ChallengeSubmissionEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import {
    ChallengeNotFoundException,
    SubmissionUrlInvalidException,
    UserChallengeSubmissionNotFoundException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    EnqueueProcessGitSubmissionJobService,
} from "@modules/bussiness"
import type {
    SubmitChallengeSubmissionsParams,
} from "./types"

/**
 * Queues the GitHub grading worker for the current user's submission rows under one challenge.
 */
@Injectable()
export class SubmitChallengeSubmissionsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueProcessGitSubmissionJobService: EnqueueProcessGitSubmissionJobService,
    ) {}

    /**
     * Validate challenge and that each submission belongs to it, then enqueue `process-git-submission` per id.
     */
    async execute(
        {
            request,
            user,
        }: SubmitChallengeSubmissionsParams,
    ): Promise<void> {
        if (!user) {
            throw new UserNotFoundException(
                {
                },
            )
        }
        const {
            challengeId,
        } = request
        const challenge = await this.entityManager.findOne(
            ChallengeEntity,
            {
                where: {
                    id: challengeId,
                },
            },
        )
        if (!challenge) {
            throw new ChallengeNotFoundException(
                {
                    id: challengeId,
                },
            )
        }
        const challengeSubmissions = await this.entityManager.find(
            ChallengeSubmissionEntity,
            {
                where: {
                    challenge: {
                        id: challengeId,
                    },
                },
            },
        )
        for (const challengeSubmission of challengeSubmissions) {
            const userChallengeSubmission = await this.entityManager.findOne(
                UserChallengeSubmissionEntity,
                {
                    where: {
                        user: {
                            id: user.id,
                        },
                        submission: {
                            id: challengeSubmission.id,
                        },
                    },
                },
            )
            if (!userChallengeSubmission) {
                throw new UserChallengeSubmissionNotFoundException(
                    {
                        challengeSubmissionId: challengeSubmission.id,
                        userId: user.id,
                    },
                )
            }
            const url = userChallengeSubmission.submissionUrl?.trim()
            if (!url) {
                throw new SubmissionUrlInvalidException(
                    {
                        id: challengeSubmission.id,
                        submissionType: challengeSubmission.type,
                        url: userChallengeSubmission.submissionUrl ?? "",
                    },
                )
            }
            await this.enqueueProcessGitSubmissionJobService.enqueue(
                {
                    userId: user.id,
                    userChallengeSubmissionId: userChallengeSubmission.id,
                },
            )
        }
    }
}
