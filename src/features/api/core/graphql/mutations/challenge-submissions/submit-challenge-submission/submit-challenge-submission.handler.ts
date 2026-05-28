import {
    EnqueueProcessGitSubmissionJobService,
    EnqueueProcessGoogleDocsSubmissionJobService,
} from "@modules/bussiness"
import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    ChallengeEntity,
    ChallengeSubmissionEntity,
    CourseEntity,
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    JobEntity,
    PostgreSqlAdvisoryLockService,
    SubmissionType,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    ChallengeNotFoundException,
    ChallengeSubmissionNotFoundException,
    SubmissionCooldownException,
    SubmissionUrlInvalidException,
    UserChallengeSubmissionNotFoundException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    DayjsService,
} from "@modules/mixin"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    SubmitChallengeSubmissionCommand,
} from "./submit-challenge-submission.command"
import type {
    SubmitChallengeSubmissionResult,
} from "./types"

@CommandHandler(SubmitChallengeSubmissionCommand)
@Injectable()
export class SubmitChallengeSubmissionHandler
    extends ICQRSHandler<
    SubmitChallengeSubmissionCommand, 
    SubmitChallengeSubmissionResult
    >
    implements ICommandHandler<
    SubmitChallengeSubmissionCommand, 
    SubmitChallengeSubmissionResult
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueProcessGitSubmissionJobService: EnqueueProcessGitSubmissionJobService,
        private readonly enqueueProcessGoogleDocsSubmissionJobService: EnqueueProcessGoogleDocsSubmissionJobService,
        private readonly dayjsService: DayjsService,
        private readonly postgreSqlAdvisoryLockService: PostgreSqlAdvisoryLockService,
    ) {
        super()
    }

    /** Process the command. */
    protected override async process(
        command: SubmitChallengeSubmissionCommand,
    ): Promise<SubmitChallengeSubmissionResult> {
        const {
            request,
            user,
            locale
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }
        const {
            challengeSubmissionId,
            githubUrl,
            mode,
        } = request
        const trimmedGithubUrl =
            typeof githubUrl === "string"
                ? githubUrl.trim()
                : ""

        /** Challenge submission. */
        const challengeSubmission = await this.entityManager.findOne(
            ChallengeSubmissionEntity,
            {
                where: {
                    id: challengeSubmissionId,
                },
            },
        )
        if (!challengeSubmission) {
            throw new ChallengeSubmissionNotFoundException({
                submissionId: challengeSubmissionId,
            })
        }
        /** Challenge. */
        const challenge = await this.entityManager.findOne(
            ChallengeEntity,
            {
                where: {
                    id: challengeSubmission.challengeId,
                },
            },
        )
        if (!challenge) {
            throw new ChallengeNotFoundException({
                id: challengeSubmission.challengeId,
            })
        }
        /** User challenge submission (upsert under advisory lock; create when `githubUrl` present). */
        const userChallengeSubmissionFromTx =
            await this.entityManager.transaction(
                async (
                    entityManager,
                ): Promise<UserChallengeSubmissionEntity> => {
                    await this.postgreSqlAdvisoryLockService.acquireUserChallengeSubmissionXactLock(
                        entityManager,
                        user.id,
                        challengeSubmissionId,
                    )
                    const userChallengeSubmission = await entityManager.findOne(
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
                        if (!trimmedGithubUrl) {
                            throw new SubmissionUrlInvalidException({
                                id: challengeSubmission.id,
                                submissionType: challengeSubmission.type,
                                url: "",
                            })
                        }
                        const created = entityManager.create(
                            UserChallengeSubmissionEntity,
                            {
                                user,
                                submission: challengeSubmission,
                                submissionUrl: trimmedGithubUrl,
                            },
                        )
                        await entityManager.save(
                            UserChallengeSubmissionEntity,
                            created,
                        )
                        return entityManager.findOneOrFail(
                            UserChallengeSubmissionEntity,
                            {
                                where: {
                                    id: created.id,
                                },
                                relations: {
                                    attempts: true,
                                },
                            },
                        )
                    }
                    if (trimmedGithubUrl) {
                        userChallengeSubmission.submissionUrl = trimmedGithubUrl
                        await entityManager.save(
                            UserChallengeSubmissionEntity,
                            userChallengeSubmission,
                        )
                        return entityManager.findOneOrFail(
                            UserChallengeSubmissionEntity,
                            {
                                where: {
                                    id: userChallengeSubmission.id,
                                },
                                relations: {
                                    attempts: true,
                                },
                            },
                        )
                    }
                    return userChallengeSubmission
                },
            )
        const userChallengeSubmission =
            await this.entityManager.findOne(
                UserChallengeSubmissionEntity,
                {
                    where: {
                        id: userChallengeSubmissionFromTx.id,
                    },
                    relations: {
                        attempts: true,
                    },
                },
            )
        if (!userChallengeSubmission) {
            throw new UserChallengeSubmissionNotFoundException({
                challengeSubmissionId: challengeSubmissionId,
            })
        }
        const userChallengeSubmissionId = userChallengeSubmission.id
        /** Last attempt. */
        const lastAttempt = userChallengeSubmission.attempts
            ?.sort((
                prev, next
            ) => next.createdAt.getTime() - prev.createdAt.getTime())[0]
        if (lastAttempt) {
            /** Cooldown. */
            const cooldownMs = envConfig().job.processGitSubmission.cooldownMs
            const nextAllowedAt = this.dayjsService.from(lastAttempt.createdAt).add(
                cooldownMs,
                "ms",
            )
            /** Check if the next allowed at is after the current time. */
            if (nextAllowedAt.isAfter(this.dayjsService.now())) {
                throw new SubmissionCooldownException({
                    nextAllowedAt: nextAllowedAt.toDate(),
                })
            }
        }
        /** Submission URL. */
        const url = userChallengeSubmission.submissionUrl?.trim()
        /** Check if the submission URL is invalid. */
        if (!url) {
            throw new SubmissionUrlInvalidException({
                id: challengeSubmission.id,
                submissionType: challengeSubmission.type,
                url: userChallengeSubmission.submissionUrl ?? "",
            })
        }
        /** Look up course and enrollment to pass to enqueue. */
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    modules: {
                        contents: {
                            challenges: {
                                id: challenge.id 
                            } 
                        } 
                    } 
                },
                select: {
                    id: true 
                },
            }
        )
        const courseId = course?.id ?? ""
        const enrollment = await this.entityManager.findOne(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: user.id 
                    }, course: {
                        id: courseId 
                    } 
                },
                select: {
                    id: true 
                },
            }
        )
        const enrollmentId = enrollment?.id ?? ""
        /** Enqueue the process git submission job. */
        let job: JobEntity | null = null
        switch (challengeSubmission.type) {
        case SubmissionType.GithubUrl:
            job = await this.enqueueProcessGitSubmissionJobService.enqueue({
                userId: user.id,
                enrollmentId,
                courseId,
                userChallengeSubmissionId,
                challengeSubmissionId: challengeSubmission.id,
                locale,
                mode,
            })
            break
        case SubmissionType.GoogleDocsUrl:
            job = await this.enqueueProcessGoogleDocsSubmissionJobService.enqueue({
                userId: user.id,
                enrollmentId,
                courseId,
                userChallengeSubmissionId,
                challengeSubmissionId: challengeSubmission.id,
                locale,
                mode,
            })
            break
        }
        return {
            jobId: job.id,
        }
    }
}
