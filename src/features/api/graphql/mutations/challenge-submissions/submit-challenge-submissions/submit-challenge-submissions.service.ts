import {
    ChallengeEntity,
    ChallengeSubmissionEntity,
    InjectPrimaryPostgreSQLEntityManager,
    JobStatus,
    SubmissionAttemptEntity,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import {
    ChallengeNotFoundException,
    SubmissionAlreadyRunningException,
    SubmissionCooldownException,
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
import {
    envConfig,
} from "@modules/env"
import {
    DayjsService,
} from "@modules/mixin"

/**
 * Queues the GitHub grading worker for the current user's submission rows under one challenge.
 */
@Injectable()
export class SubmitChallengeSubmissionsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueProcessGitSubmissionJobService: EnqueueProcessGitSubmissionJobService,
        private readonly dayjsService: DayjsService,
    ) {}

    async onModuleInit() {
        
    }
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
                    relations: {
                        attempts: true,
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

            // 1. Check if any attempt is currently running
            const runningAttempt = userChallengeSubmission.attempts?.find(
                (a) => a.status === JobStatus.Processing,
            )
            if (runningAttempt) {
                throw new SubmissionAlreadyRunningException({
                    submissionId: challengeSubmission.id,
                })
            }

            // 2. Check 3-hour cooldown
            const lastAttempt = userChallengeSubmission.attempts
                ?.sort((prev, next) => next.createdAt.getTime() - prev.createdAt.getTime())[0]

            if (lastAttempt) {
                const cooldownMs = envConfig().job.processGitSubmission.cooldownMs
                const nextAllowedAt = this.dayjsService.from(lastAttempt.createdAt).add(cooldownMs, "ms")
                if (nextAllowedAt.isAfter(this.dayjsService.now())) {
                    throw new SubmissionCooldownException({
                        nextAllowedAt: nextAllowedAt.toDate(),
                    })
                }
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

            // 3. Create new attempt
            const attempt = await this.entityManager.save(
                SubmissionAttemptEntity,
                {
                    userChallengeSubmission: {
                        id: userChallengeSubmission.id,
                    },
                    submissionUrl: url,
                    status: JobStatus.Processing,
                    attemptNumber: (userChallengeSubmission.attempts?.length || 0) + 1,
                },
            )

            await this.enqueueProcessGitSubmissionJobService.enqueue(
                {
                    userId: user.id,
                    userChallengeSubmissionId: userChallengeSubmission.id,
                    submissionAttemptId: attempt.id,
                },
            )
        }
    }
}
