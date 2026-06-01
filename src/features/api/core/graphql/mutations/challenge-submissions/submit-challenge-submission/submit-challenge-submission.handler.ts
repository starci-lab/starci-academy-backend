import {
    EnqueueProcessGitSubmissionJobService,
    EnqueueProcessGitSubmissionV2JobService,
    EnqueueProcessGoogleDocsSubmissionJobService,
    EnqueueProcessGoogleDocsSubmissionV2JobService,
    CreditUsageService,
} from "@modules/bussiness"
import {
    AiEntitlementService,
    GradingLaneValidationService,
    ModelRecommendation,
    resolveGradingCreditCost,
    validatedLaneToAiJobSelection,
} from "@modules/ai"
import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    AiMode,
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
    SubmissionQuotaExceededException,
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
        private readonly enqueueProcessGitSubmissionV2JobService: EnqueueProcessGitSubmissionV2JobService,
        private readonly enqueueProcessGoogleDocsSubmissionJobService: EnqueueProcessGoogleDocsSubmissionJobService,
        private readonly enqueueProcessGoogleDocsSubmissionV2JobService: EnqueueProcessGoogleDocsSubmissionV2JobService,
        private readonly dayjsService: DayjsService,
        private readonly postgreSqlAdvisoryLockService: PostgreSqlAdvisoryLockService,
        private readonly gradingLaneValidationService: GradingLaneValidationService,
        private readonly creditUsageService: CreditUsageService,
        private readonly aiEntitlementService: AiEntitlementService,
    ) {
        super()
    }

    /**
     * Reject the submission up-front when the user has no grading quota left for
     * the chosen lane (replaces the old fixed 3h cooldown).
     *
     * - `byok`    → own key, never quota-limited.
     * - `auto`    → shared 50-credit rolling pool.
     * - `premium` → the user's tier credit pool (both windows must cover the cost).
     *
     * @param userId - Submitter whose quota is checked.
     * @param mode - Resolved lane from the validated grading selection.
     * @throws SubmissionQuotaExceededException when the lane is out of quota.
     */
    private async assertGradingQuota(
        userId: string,
        mode: AiMode,
    ): Promise<void> {
        // BYOK runs on the user's own key — never gated
        if (mode === AiMode.Byok) {
            return
        }
        // Auto → block when over the shared 50-credit rolling pool
        if (mode === AiMode.Auto) {
            const snapshot = await this.creditUsageService.getSnapshot(userId)
            if (snapshot.overQuota) {
                throw new SubmissionQuotaExceededException({
                    mode,
                    waitUntil: snapshot.resetAt
                        ? this.dayjsService.from(snapshot.resetAt).format("HH:mm DD/MM/YYYY")
                        : null,
                })
            }
            return
        }
        // Premium → block when the tier credit pool can't cover this grading's cost
        const recommendation = envConfig().ai.modelRecommendation as ModelRecommendation
        const cost = resolveGradingCreditCost({
            mode: AiMode.Premium,
            recommendation,
        })
        const snapshot = await this.aiEntitlementService.snapshot({
            userId,
        })
        // the weekly window is the binding (later) wait when it is the blocker
        const lacksWeek = snapshot.premium.remainingWeek < cost
        const lacks5h = snapshot.premium.remaining5h < cost
        if (lacksWeek || lacks5h) {
            const resetAt = lacksWeek
                ? snapshot.windowWeekResetAt
                : snapshot.window5hResetAt
            throw new SubmissionQuotaExceededException({
                mode,
                waitUntil: resetAt
                    ? this.dayjsService.from(resetAt).format("HH:mm DD/MM/YYYY")
                    : null,
            })
        }
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
            selectedModel,
            selectedModelProvider,
            lang,
            byokApiKey,
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
        const validatedLane = await this.gradingLaneValidationService.validate({
            userId: user.id,
            mode,
            model: selectedModel,
            provider: selectedModelProvider,
            byokApiKey,
        })
        /**
         * Persist the user's grading-lane + model pick on the submission row so
         * the picker pre-fills on reopen. Only overwrite fields the client sent
         * (undefined = leave the previous choice untouched).
         */
        if (
            mode !== undefined
            || selectedModel !== undefined
            || selectedModelProvider !== undefined
            || lang !== undefined
        ) {
            if (mode !== undefined) {
                userChallengeSubmission.selectedMode = validatedLane.mode
            }
            if (selectedModel !== undefined) {
                userChallengeSubmission.selectedModel = validatedLane.gradingModel ?? null
            }
            if (selectedModelProvider !== undefined) {
                userChallengeSubmission.selectedModelProvider = validatedLane.gradingProvider ?? null
            }
            // persist the chosen programming language so the V2 tabs reopen on it
            if (lang !== undefined) {
                userChallengeSubmission.selectedLang = lang
            }
            await this.entityManager.save(
                UserChallengeSubmissionEntity,
                userChallengeSubmission,
            )
        }
        /** Quota gate (replaces the old fixed 3h cooldown): block when the chosen lane is out of quota. */
        await this.assertGradingQuota(user.id,
            validatedLane.mode)
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
        // collapse the validated lane into the discriminated AI selection carried on the job
        const ai = validatedLaneToAiJobSelection(validatedLane)
        // use the request lang, else fall back to the language persisted on the submission row
        const effectiveLang = lang ?? userChallengeSubmission.selectedLang ?? undefined
        /**
         * Enqueue the grading job. A verified (SCHEMA V2) challenge routes to the V2 pipeline that
         * grades against outcome/approach criteria; the learner's chosen programming language
         * (`lang`) selects the matching approach-criteria bucket. Legacy challenges keep the V1 path.
         */
        const isV2Challenge = Boolean(challenge.verified)
        const enqueueParams = {
            userId: user.id,
            enrollmentId,
            courseId,
            userChallengeSubmissionId,
            challengeSubmissionId: challengeSubmission.id,
            locale,
            ai,
        }
        let job: JobEntity | null = null
        switch (challengeSubmission.type) {
        case SubmissionType.GithubUrl:
            job = isV2Challenge
                ? await this.enqueueProcessGitSubmissionV2JobService.enqueue({
                    ...enqueueParams,
                    lang: effectiveLang,
                })
                : await this.enqueueProcessGitSubmissionJobService.enqueue(enqueueParams)
            break
        case SubmissionType.GoogleDocsUrl:
            job = isV2Challenge
                ? await this.enqueueProcessGoogleDocsSubmissionV2JobService.enqueue(enqueueParams)
                : await this.enqueueProcessGoogleDocsSubmissionJobService.enqueue(enqueueParams)
            break
        }
        return {
            jobId: job.id,
        }
    }
}
