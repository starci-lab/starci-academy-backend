import {
    EnqueueProcessGitSubmissionJobService,
} from "@modules/bussiness/jobs/enqueue/process-git-submission.service"
import {
    EnqueueProcessGoogleDocsSubmissionJobService,
} from "@modules/bussiness/jobs/enqueue/process-google-docs-submission.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    GradingLaneValidationService,
} from "@modules/ai/grading-lane-validation.service"
import {
    validatedLaneToAiJobSelection,
} from "@modules/ai/utils/validated-lane-to-ai-job-selection"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    ChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/challenge-submission.entity"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    UserChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"
import {
    SubmissionType,
} from "@modules/databases/postgresql/primary/enums/submission-type"
import {
    PostgreSqlAdvisoryLockService,
} from "@modules/databases/postgresql/primary/lock/postgresql-advisory-lock.service"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    ChallengeNotFoundException,
} from "@modules/platform/exceptions/errors/courses/challenge-not-found"
import {
    ChallengePremiumLockedException,
} from "@modules/platform/exceptions/errors/courses/challenge-premium-locked"
import {
    ChallengeSubmissionNotFoundException,
} from "@modules/platform/exceptions/errors/courses/challenge-submission-not-found"
import {
    SubmissionQuotaExceededException,
} from "@modules/platform/exceptions/errors/courses/submission-quota-exceeded"
import {
    SubmissionUrlInvalidException,
} from "@modules/platform/exceptions/errors/courses/submission-url-invalid"
import {
    UserChallengeSubmissionNotFoundException,
} from "@modules/platform/exceptions/errors/courses/user-challenge-submission-not-found"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
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
    ApplySelectedGradingPreferencesParams,
    SubmitChallengeSubmissionResult,
} from "./types/submit-challenge-submission"

@CommandHandler(SubmitChallengeSubmissionCommand)
@Injectable()
/**
 * Enqueues challenge grading after quota + premium + URL checks. Uses an
 * advisory lock per user-submission so a double-click cannot spawn two jobs
 * against the shared credit pool.
 */
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
     * Reject the submission up-front when the user has no grading quota left in
     * the shared credit pool (replaces the old fixed 3h cooldown). Both rolling
     * windows (5h + week) must still have headroom.
     *
     * @param userId - Submitter whose quota is checked.
     * @throws SubmissionQuotaExceededException when the pool is exhausted.
     */
    private async assertGradingQuota(
        userId: string,
    ): Promise<void> {
        const snapshot = await this.aiEntitlementService.snapshot({
            userId,
        })
        // block when either rolling window is spent (the weekly window is the
        // binding, later wait when it is the blocker)
        const lacksWeek = snapshot.credit.remainingWeek <= 0
        const lacks5h = snapshot.credit.remaining5h <= 0
        if (lacksWeek || lacks5h) {
            const resetAt = lacksWeek
                ? snapshot.windowWeekResetAt
                : snapshot.window5hResetAt
            throw new SubmissionQuotaExceededException({
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
        // challenges are open ONLY inside FREE (non-premium) content for now -- a
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
         * Resolve the course (challenge -> content -> module -> course) and
         * resolve-or-create the trial enrollment (user x course) up front so we can
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
            model: selectedModel,
            provider: selectedModelProvider,
        })
        /**
         * Persist the user's grading model pick on the submission row so the
         * picker pre-fills on reopen. Only overwrite fields the client sent
         * (undefined = leave the previous choice untouched).
         */
        await this.applySelectedGradingPreferences(userChallengeSubmission,
            {
                selectedModel,
                selectedModelProvider,
                lang,
                validatedLane,
            })
        /** Quota gate (replaces the old fixed 3h cooldown): block when the pool is exhausted. */
        await this.assertGradingQuota(user.id)
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

    /**
     * Persist the caller's grading model/provider/lang selection on the submission row
     * so the picker pre-fills on reopen. Only overwrites fields the client actually sent
     * (`undefined` = leave the previous choice untouched); a no-op write is skipped entirely.
     * @param userChallengeSubmission - The row to patch and save.
     * @param params - The client-sent picks (each possibly `undefined`) and the validated lane.
     */
    private async applySelectedGradingPreferences(
        userChallengeSubmission: UserChallengeSubmissionEntity,
        {
            selectedModel,
            selectedModelProvider,
            lang,
            validatedLane,
        }: ApplySelectedGradingPreferencesParams,
    ): Promise<void> {
        if (selectedModel === undefined && selectedModelProvider === undefined && lang === undefined) {
            return
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
}
