import {
    EnqueueProcessGitSubmissionJobService,
    EnqueueProcessGoogleDocsSubmissionJobService,
    UserService,
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
    ContentEntity,
    CourseEntity,
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
    ChallengePremiumLockedException,
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
        private readonly enqueueProcessGoogleDocsSubmissionJobService: EnqueueProcessGoogleDocsSubmissionJobService,
        private readonly dayjsService: DayjsService,
        private readonly postgreSqlAdvisoryLockService: PostgreSqlAdvisoryLockService,
        private readonly gradingLaneValidationService: GradingLaneValidationService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly userService: UserService,
    ) {
        super()
    }

    /**
     * Reject the submission up-front when the user has no grading quota left for
     * the chosen lane (replaces the old fixed 3h cooldown).
     *
     * - `auto` / `premium` → one shared credit pool (free base + tier); both
     *   rolling windows must cover the cost.
     *
     * @param userId - Submitter whose quota is checked.
     * @param mode - Resolved lane from the validated grading selection.
     * @throws SubmissionQuotaExceededException when the lane is out of quota.
     */
    private async assertGradingQuota(
        userId: string,
        mode: AiMode,
    ): Promise<void> {
        // Auto + Premium share one credit pool → block when either rolling window
        // cannot cover this grading's cost
        const recommendation = envConfig().ai.modelRecommendation as ModelRecommendation
        const cost = resolveGradingCreditCost({
            mode,
            recommendation,
        })
        const snapshot = await this.aiEntitlementService.snapshot({
            userId,
        })
        // the weekly window is the binding (later) wait when it is the blocker
        const lacksWeek = snapshot.credit.remainingWeek < cost
        const lacks5h = snapshot.credit.remaining5h < cost
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
        // challenges are open ONLY inside FREE (non-premium) content for now — a
        // premium content's challenge requires purchasing the course first
        const ownerContent = await this.entityManager.findOne(
            ContentEntity,
            {
                where: {
                    challenges: {
                        id: challenge.id,
                    },
                },
                select: {
                    id: true,
                    isPremium: true,
                },
            },
        )
        if (ownerContent?.isPremium) {
            throw new ChallengePremiumLockedException({
                contentId: ownerContent.id,
            })
        }
        /**
         * Resolve the course (challenge → content → module → course) and
         * resolve-or-create the trial enrollment (user × course) up front so we can
         * key the submission row by enrollment going forward (we still set user_id
         * during the re-key transition) and pass the enrollment id to the grading job.
         */
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    modules: {
                        contents: {
                            challenges: {
                                id: challenge.id,
                            },
                        },
                    },
                },
                select: {
                    id: true,
                },
            },
        )
        const courseId = course?.id ?? ""
        const enrollment = courseId
            ? await this.userService.resolveOrCreateTrialEnrollment(
                user.id,
                courseId,
            )
            : null
        const enrollmentId = enrollment?.id ?? ""
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
                                ...(enrollment
                                    ? {
                                        enrollment,
                                    }
                                    : {
                                    }),
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
                        // backfill enrollment on a pre-existing row that predates the re-key
                        if (enrollment && !userChallengeSubmission.enrollmentId) {
                            userChallengeSubmission.enrollment = enrollment
                        }
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
        // collapse the validated lane into the discriminated AI selection carried on the job
        const ai = validatedLaneToAiJobSelection(validatedLane)
        // use the request lang, else fall back to the language persisted on the submission row
        const effectiveLang = lang ?? userChallengeSubmission.selectedLang ?? undefined
        /**
         * Enqueue the grading job on the SCHEMA V2 pipeline (grades against outcome/approach
         * criteria); the learner's chosen programming language (`lang`) selects the matching
         * approach-criteria bucket. The legacy V1 pipeline has been removed.
         */
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
            job = await this.enqueueProcessGitSubmissionJobService.enqueue({
                ...enqueueParams,
                lang: effectiveLang,
            })
            break
        case SubmissionType.GoogleDocsUrl:
            job = await this.enqueueProcessGoogleDocsSubmissionJobService.enqueue(enqueueParams)
            break
        }
        return {
            jobId: job.id,
        }
    }
}
