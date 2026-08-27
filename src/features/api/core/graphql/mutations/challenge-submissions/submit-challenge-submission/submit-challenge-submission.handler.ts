import {
    EnqueueProcessGitSubmissionJobService
} from "@modules/bussiness/jobs/enqueue/process-git-submission.service"
import {
    EnqueueProcessGoogleDocsSubmissionJobService
} from "@modules/bussiness/jobs/enqueue/process-google-docs-submission.service"
import {
    UserService
} from "@modules/bussiness/user/user.service"
import {
    AiEntitlementService
} from "@modules/ai/ai-entitlement.service"
import {
    GradingLaneValidationService
} from "@modules/ai/grading-lane-validation.service"
import {
    validatedLaneToAiJobSelection
} from "@modules/ai/utils/validated-lane-to-ai-job-selection"
import {
    ICQRSHandler
} from "@modules/platform/cqrs/icqrs-handler"
import {
    ChallengeSubmissionEntity
} from "@modules/databases/postgresql/primary/entities/challenge-submission.entity"
import {
    ChallengeEntity
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    JobEntity
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    UserChallengeSubmissionEntity
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"
import {
    UserChallengeSubmissionAttemptEntity
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission-attempt.entity"
import {
    SubmissionType
} from "@modules/databases/postgresql/primary/enums/submission-type"
import {
    JobStatus
} from "@modules/databases/postgresql/primary/enums/job-status"
import {
    PostgreSqlAdvisoryLockService
} from "@modules/databases/postgresql/primary/lock/postgresql-advisory-lock.service"
import {
    InjectPrimaryPostgreSQLEntityManager
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    ChallengeNotFoundException
} from "@modules/platform/exceptions/errors/courses/challenge-not-found"
import {
    ChallengePremiumLockedException
} from "@modules/platform/exceptions/errors/courses/challenge-premium-locked"
import {
    ChallengeSubmissionNotFoundException
} from "@modules/platform/exceptions/errors/courses/challenge-submission-not-found"
import {
    SubmissionQuotaExceededException
} from "@modules/platform/exceptions/errors/courses/submission-quota-exceeded"
import {
    SubmissionUrlInvalidException
} from "@modules/platform/exceptions/errors/courses/submission-url-invalid"
import {
    UserChallengeSubmissionNotFoundException
} from "@modules/platform/exceptions/errors/courses/user-challenge-submission-not-found"
import {
    ChallengeSubmissionCollectionIncompleteException
} from "@modules/platform/exceptions/errors/courses/challenge-submission-collection-incomplete"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
import {
    DayjsService
} from "@modules/lib/mixin/dayjs.service"
import {
    Injectable
} from "@nestjs/common"
import {
    CommandHandler, ICommandHandler
} from "@nestjs/cqrs"
import {
    In, type EntityManager
} from "typeorm"
import {
    v4 as uuidv4
} from "uuid"
import {
    SubmitChallengeSubmissionCommand
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
    implements
    ICommandHandler<
      SubmitChallengeSubmissionCommand,
      SubmitChallengeSubmissionResult
    >
{
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
    private async assertGradingQuota(userId: string): Promise<void> {
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
        const { request, user, locale } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }
        if ((request.deliverables?.length ?? 0) > 0) {
            return this.processAggregate(command)
        }
        const {
            challengeSubmissionId,
            githubUrl,
            selectedModel,
            selectedModelProvider,
            lang,
            idempotencyKey,
            attemptGroupId,
        } = request
        const trimmedGithubUrl =
      typeof githubUrl === "string" ? githubUrl.trim() : ""

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
        const challenge = await this.entityManager.findOne(ChallengeEntity,
            {
                where: {
                    id: challengeSubmission.challengeId,
                },
            })
        if (!challenge) {
            throw new ChallengeNotFoundException({
                id: challengeSubmission.challengeId,
            })
        }
        // challenges are open ONLY inside FREE (non-premium) content for now -- a
        // premium content's challenge requires purchasing the course first
        const ownerContent = await this.entityManager.findOne(ContentEntity,
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
            })
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
        const course = await this.entityManager.findOne(CourseEntity,
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
            })
        const courseId = course?.id ?? ""
        const enrollment = courseId
            ? await this.userService.resolveOrCreateTrialEnrollment(user.id,
                courseId)
            : null
        const enrollmentId = enrollment?.id ?? ""
        /** User challenge submission (upsert under advisory lock; create when `githubUrl` present). */
        const userChallengeSubmissionFromTx = await this.entityManager.transaction(
            async (entityManager): Promise<UserChallengeSubmissionEntity> => {
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
                    const created = entityManager.create(UserChallengeSubmissionEntity,
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
                        })
                    await entityManager.save(UserChallengeSubmissionEntity,
                        created)
                    return entityManager.findOneOrFail(UserChallengeSubmissionEntity,
                        {
                            where: {
                                id: created.id,
                            },
                            relations: {
                                attempts: true,
                            },
                        })
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
                    return entityManager.findOneOrFail(UserChallengeSubmissionEntity,
                        {
                            where: {
                                id: userChallengeSubmission.id,
                            },
                            relations: {
                                attempts: true,
                            },
                        })
                }
                return userChallengeSubmission
            },
        )
        const userChallengeSubmission = await this.entityManager.findOne(
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
        const assertAttemptGroupComplete = async (): Promise<void> => {
            if (attemptGroupId !== undefined) {
                const authoredDeliverables = await this.entityManager.find(
                    ChallengeSubmissionEntity,
                    {
                        where: {
                            challenge: {
                                id: challenge.id,
                            },
                        },
                        select: {
                            id: true,
                        },
                    },
                )
                const authoredIds = authoredDeliverables.map((item) => item.id)
                const savedDeliverables =
                    authoredIds.length === 0
                        ? []
                        : await this.entityManager.find(UserChallengeSubmissionEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    submission: {
                                        id: In(authoredIds),
                                    },
                                },
                            })
                const completeCount = savedDeliverables.filter(
                    (item) => (item.submissionUrl ?? "").trim().length > 0,
                ).length
                if (authoredIds.length === 0 || completeCount !== authoredIds.length) {
                    throw new ChallengeSubmissionCollectionIncompleteException({
                        challengeId: challenge.id,
                        expectedCount: authoredIds.length,
                        completeCount,
                    })
                }
            }
        }
        await assertAttemptGroupComplete()
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
        const effectiveLang =
      lang ?? userChallengeSubmission.selectedLang ?? undefined
        /**
     * Enqueue the grading job on the SCHEMA V2 pipeline (grades against outcome/approach
     * criteria); the learner's chosen programming language (`lang`) selects the matching
     * approach-criteria bucket. The legacy V1 pipeline has been removed.
     */
        const evaluationJobId = idempotencyKey?.trim() || uuidv4()
        const enqueueParams = {
            userId: user.id,
            enrollmentId,
            courseId,
            userChallengeSubmissionId,
            challengeSubmissionId: challengeSubmission.id,
            locale,
            ai,
            reservedJobId: evaluationJobId,
            deferPublish: true,
        }
        const createOrReplayAttempt = async () => this.entityManager.transaction(
            async (entityManager) => {
                await this.postgreSqlAdvisoryLockService.acquireUserChallengeSubmissionXactLock(
                    entityManager,
                    user.id,
                    challengeSubmissionId,
                )
                const replay = await entityManager.findOne(
                    UserChallengeSubmissionAttemptEntity,
                    {
                        where: {
                            idempotencyKey: evaluationJobId,
                            userChallengeSubmission: {
                                id: userChallengeSubmissionId,
                            },
                        },
                    },
                )
                if (replay) {
                    const replayJob = await entityManager.findOneOrFail(JobEntity,
                        {
                            where: {
                                id: evaluationJobId,
                            },
                        })
                    return {
                        attempt: replay,
                        job: replayJob,
                        replayed: true,
                    }
                }
                const attemptNumber =
          (await entityManager.count(UserChallengeSubmissionAttemptEntity,
              {
                  where: {
                      userChallengeSubmission: {
                          id: userChallengeSubmissionId,
                      },
                  },
              })) + 1
                const attempt = await entityManager.save(
                    UserChallengeSubmissionAttemptEntity,
                    entityManager.create(UserChallengeSubmissionAttemptEntity,
                        {
                            idempotencyKey: evaluationJobId,
                            attemptGroupId: attemptGroupId ?? null,
                            userChallengeSubmission: {
                                id: userChallengeSubmissionId,
                            },
                            submissionUrl: url,
                            attemptNumber,
                            score: null,
                            shortFeedback: null,
                            processedAt: null,
                            defaultLocale: locale,
                            status: "evaluating",
                            draftRevision: userChallengeSubmission.draftRevision ?? 0,
                            submittedAt: new Date(),
                            platformDecision: null,
                            confidence: null,
                            uncertainty: null,
                            nextAction: null,
                            finalizationRevision: 0,
                            aiAdvisoryEvidence: null,
                        }),
                )
                const preparedParams = {
                    ...enqueueParams,
                    attemptId: attempt.id,
                    entityManager,
                }
                let job: JobEntity
                switch (challengeSubmission.type) {
                case SubmissionType.GithubUrl:
                    job = await this.enqueueProcessGitSubmissionJobService.enqueue({
                        ...preparedParams,
                        lang: effectiveLang,
                    })
                    break
                case SubmissionType.GoogleDocsUrl:
                    job =
              await this.enqueueProcessGoogleDocsSubmissionJobService.enqueue(
                  preparedParams,
              )
                    break
                default:
                    throw new SubmissionUrlInvalidException({
                        id: challengeSubmission.id,
                        submissionType: challengeSubmission.type,
                        url,
                    })
                }
                return {
                    attempt,
                    job,
                    replayed: false,
                }
            },
        )
        let prepared = await createOrReplayAttempt()
        const requeueIfStale = async (
            currentPrepared: Awaited<ReturnType<typeof createOrReplayAttempt>>,
        ): Promise<Awaited<ReturnType<typeof createOrReplayAttempt>>> => {
            let prepared = currentPrepared
            const staleJob =
      prepared.replayed &&
      prepared.attempt.status === "evaluating" &&
      (prepared.job.status === JobStatus.Failed ||
        ([JobStatus.Queued,
            JobStatus.Processing].includes(
            prepared.job.status,
        ) &&
          Date.now() - prepared.job.updatedAt.getTime() >= 5 * 60 * 1000))
            if (
                prepared.replayed &&
      (prepared.attempt.status === "evaluation_unavailable" || staleJob)
            ) {
                prepared = await this.entityManager.transaction(async (entityManager) => {
                    await this.postgreSqlAdvisoryLockService.acquireUserChallengeSubmissionXactLock(
                        entityManager,
                        user.id,
                        challengeSubmissionId,
                    )
                    const currentAttempt = await entityManager.findOneOrFail(
                        UserChallengeSubmissionAttemptEntity,
                        {
                            where: {
                                id: prepared.attempt.id,
                            },
                        },
                    )
                    const currentJob = await entityManager.findOneOrFail(JobEntity,
                        {
                            where: {
                                id: evaluationJobId,
                            },
                        })
                    const currentJobIsStale =
          currentAttempt.status === "evaluating" &&
          (currentJob.status === JobStatus.Failed ||
            ([JobStatus.Queued,
                JobStatus.Processing].includes(
                currentJob.status,
            ) &&
              Date.now() - currentJob.updatedAt.getTime() >= 5 * 60 * 1000))
                    if (
                        currentAttempt.status !== "evaluation_unavailable" &&
          !currentJobIsStale
                    ) {
                        return {
                            attempt: currentAttempt,
                            job: currentJob,
                            replayed: true,
                        }
                    }
                    const retryParams = {
                        ...enqueueParams,
                        jobId: evaluationJobId,
                        attemptId: currentAttempt.id,
                        entityManager,
                        deferPublish: true,
                    }
                    let requeuedJob: JobEntity
                    switch (challengeSubmission.type) {
                    case SubmissionType.GithubUrl:
                        requeuedJob =
              await this.enqueueProcessGitSubmissionJobService.enqueue({
                  ...retryParams,
                  lang: effectiveLang,
              })
                        break
                    case SubmissionType.GoogleDocsUrl:
                        requeuedJob =
              await this.enqueueProcessGoogleDocsSubmissionJobService.enqueue(
                  retryParams,
              )
                        break
                    default:
                        throw new SubmissionUrlInvalidException({
                            id: challengeSubmission.id,
                            submissionType: challengeSubmission.type,
                            url,
                        })
                    }
                    currentAttempt.status = "evaluating"
                    currentAttempt.uncertainty = null
                    currentAttempt.nextAction = null
                    await entityManager.save(
                        UserChallengeSubmissionAttemptEntity,
                        currentAttempt,
                    )
                    return {
                        attempt: currentAttempt,
                        job: requeuedJob,
                        replayed: false,
                    }
                })
            }
            return prepared
        }
        prepared = await requeueIfStale(prepared)
        const publishPrepared = (
            currentPrepared: Awaited<ReturnType<typeof createOrReplayAttempt>>,
        ): void => {
            const prepared = currentPrepared
            if (!prepared.replayed) {
                const settleUnavailable = async (
                    publication: Promise<void>,
                ): Promise<void> => {
                    try {
                        await publication
                    } catch {
                        await this.entityManager.update(
                            UserChallengeSubmissionAttemptEntity,
                            {
                                id: prepared.attempt.id,
                                status: "evaluating",
                            },
                            {
                                status: "evaluation_unavailable",
                                uncertainty:
                "Evaluation could not be queued. Your submitted attempt is preserved.",
                                nextAction: "Retry evaluation for this same attempt.",
                            },
                        )
                    }
                }
                switch (challengeSubmission.type) {
                case SubmissionType.GithubUrl:
                    if (
                        typeof this.enqueueProcessGitSubmissionJobService.publish ===
            "function"
                    ) {
                        void settleUnavailable(
                            this.enqueueProcessGitSubmissionJobService.publish(prepared.job),
                        )
                    }
                    break
                case SubmissionType.GoogleDocsUrl:
                    if (
                        typeof this.enqueueProcessGoogleDocsSubmissionJobService.publish ===
            "function"
                    ) {
                        void settleUnavailable(
                            this.enqueueProcessGoogleDocsSubmissionJobService.publish(
                                prepared.job,
                            ),
                        )
                    }
                    break
                }
            }
        }
        publishPrepared(prepared)
        return {
            jobId: prepared.job.id,
            attemptId: prepared.attempt.id,
            attemptGroupId,
        }
    }

    /**
   * Commit every authored deliverable snapshot and its durable grading row in one
   * PostgreSQL transaction. Broker publication happens only after commit, so a
   * partially accepted whole-Challenge attempt cannot be observed.
   */
    private async processAggregate(
        command: SubmitChallengeSubmissionCommand,
    ): Promise<SubmitChallengeSubmissionResult> {
        const { request, user, locale } = command.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        const deliverables = request.deliverables ?? []
        const attemptGroupId = request.attemptGroupId?.trim()
        const submissionIds = deliverables.map(
            (item) => item.challengeSubmissionId,
        )
        const jobIds = deliverables.map((item) => item.idempotencyKey.trim())
        if (
            !attemptGroupId ||
      deliverables.length === 0 ||
      new Set(submissionIds).size !== deliverables.length ||
      jobIds.some((id) => id.length === 0) ||
      new Set(jobIds).size !== deliverables.length
        ) {
            throw new ChallengeSubmissionCollectionIncompleteException({
                challengeId: attemptGroupId ?? "unknown",
                expectedCount: deliverables.length,
                completeCount: 0,
            })
        }

        const authored = await this.entityManager.find(ChallengeSubmissionEntity,
            {
                where: {
                    id: In(submissionIds),
                },
                relations: {
                    challenge: true,
                },
            })
        const challengeId = authored[0]?.challengeId
        if (
            !challengeId ||
      authored.some((item) => item.challengeId !== challengeId)
        ) {
            throw new ChallengeSubmissionCollectionIncompleteException({
                challengeId: challengeId ?? "unknown",
                expectedCount: submissionIds.length,
                completeCount: authored.length,
            })
        }
        const allAuthored = await this.entityManager.find(
            ChallengeSubmissionEntity,
            {
                where: {
                    challenge: {
                        id: challengeId,
                    },
                },
                select: {
                    id: true,
                },
            },
        )
        const expectedIds = allAuthored.map((item) => item.id)
            .sort((left, right) => left.localeCompare(right))
        const actualIds = [...submissionIds]
            .sort((left, right) => left.localeCompare(right))
        if (
            expectedIds.length === 0 ||
      expectedIds.length !== actualIds.length ||
      expectedIds.some((id, index) => id !== actualIds[index])
        ) {
            throw new ChallengeSubmissionCollectionIncompleteException({
                challengeId,
                expectedCount: expectedIds.length,
                completeCount: actualIds.length,
            })
        }
        const challenge = await this.entityManager.findOne(ChallengeEntity,
            {
                where: {
                    id: challengeId,
                },
            })
        if (!challenge) {
            throw new ChallengeNotFoundException({
                id: challengeId,
            })
        }
        const ownerContent = await this.entityManager.findOne(ContentEntity,
            {
                where: {
                    challenges: {
                        id: challengeId,
                    },
                },
                select: {
                    id: true,
                    isPremium: true,
                },
            })
        if (ownerContent?.isPremium) {
            throw new ChallengePremiumLockedException({
                contentId: ownerContent.id,
            })
        }
        const course = await this.entityManager.findOne(CourseEntity,
            {
                where: {
                    modules: {
                        contents: {
                            challenges: {
                                id: challengeId,
                            },
                        },
                    },
                },
                select: {
                    id: true,
                },
            })
        const courseId = course?.id ?? ""
        const enrollment = courseId
            ? await this.userService.resolveOrCreateTrialEnrollment(user.id,
                courseId)
            : null
        const enrollmentId = enrollment?.id ?? ""
        const validatedLane = await this.gradingLaneValidationService.validate({
            userId: user.id,
            model: request.selectedModel,
            provider: request.selectedModelProvider,
        })
        await this.assertGradingQuota(user.id)
        const ai = validatedLaneToAiJobSelection(validatedLane)

        const prepared = await this.entityManager.transaction(
            async (entityManager) => {
                const records: Array<{
          submission: ChallengeSubmissionEntity;
          attempt: UserChallengeSubmissionAttemptEntity;
          job: JobEntity;
          replayed: boolean;
        }> = []
                for (const submissionId of [...submissionIds]
                    .sort((left, right) => left.localeCompare(right))) {
                    await this.postgreSqlAdvisoryLockService.acquireUserChallengeSubmissionXactLock(
                        entityManager,
                        user.id,
                        submissionId,
                    )
                }
                const prepareDeliverable = async (
                    deliverable: typeof deliverables[number],
                    completeCount: number,
                ) => {
                    const submission = authored.find(
                        (item) => item.id === deliverable.challengeSubmissionId,
                    )
                    if (!submission) {
                        throw new ChallengeSubmissionNotFoundException({
                            submissionId: deliverable.challengeSubmissionId,
                        })
                    }
                    const userSubmission = await entityManager.findOne(
                        UserChallengeSubmissionEntity,
                        {
                            where: {
                                user: {
                                    id: user.id,
                                },
                                submission: {
                                    id: submission.id,
                                },
                            },
                        },
                    )
                    const url = userSubmission?.submissionUrl?.trim() ?? ""
                    if (!userSubmission || !url) {
                        throw new ChallengeSubmissionCollectionIncompleteException({
                            challengeId,
                            expectedCount: expectedIds.length,
                            completeCount,
                        })
                    }
                    if (enrollment && !userSubmission.enrollmentId) {
                        userSubmission.enrollment = enrollment
                    }
                    if (request.selectedModel !== undefined) {
                        userSubmission.selectedModel = validatedLane.gradingModel ?? null
                    }
                    if (request.selectedModelProvider !== undefined) {
                        userSubmission.selectedModelProvider =
              validatedLane.gradingProvider ?? null
                    }
                    if (request.lang !== undefined) {
                        userSubmission.selectedLang = request.lang
                    }
                    await entityManager.save(
                        UserChallengeSubmissionEntity,
                        userSubmission,
                    )

                    const jobId = deliverable.idempotencyKey.trim()
                    const replay = await entityManager.findOne(
                        UserChallengeSubmissionAttemptEntity,
                        {
                            where: {
                                idempotencyKey: jobId,
                                userChallengeSubmission: {
                                    id: userSubmission.id,
                                },
                            },
                        },
                    )
                    if (replay) {
                        return {
                            submission,
                            attempt: replay,
                            job: await entityManager.findOneOrFail(JobEntity,
                                {
                                    where: {
                                        id: jobId,
                                    },
                                }),
                            replayed: true,
                        }
                    }
                    const attemptNumber =
            (await entityManager.count(UserChallengeSubmissionAttemptEntity,
                {
                    where: {
                        userChallengeSubmission: {
                            id: userSubmission.id,
                        },
                    },
                })) + 1
                    const attempt = await entityManager.save(
                        UserChallengeSubmissionAttemptEntity,
                        entityManager.create(UserChallengeSubmissionAttemptEntity,
                            {
                                idempotencyKey: jobId,
                                attemptGroupId,
                                userChallengeSubmission: {
                                    id: userSubmission.id,
                                },
                                submissionUrl: url,
                                attemptNumber,
                                score: null,
                                shortFeedback: null,
                                processedAt: null,
                                defaultLocale: locale,
                                status: "evaluating",
                                draftRevision: userSubmission.draftRevision ?? 0,
                                submittedAt: new Date(),
                                platformDecision: null,
                                confidence: null,
                                uncertainty: null,
                                nextAction: null,
                                finalizationRevision: 0,
                                aiAdvisoryEvidence: null,
                            }),
                    )
                    const enqueueParams = {
                        userId: user.id,
                        enrollmentId,
                        courseId,
                        userChallengeSubmissionId: userSubmission.id,
                        challengeSubmissionId: submission.id,
                        locale,
                        ai,
                        reservedJobId: jobId,
                        attemptId: attempt.id,
                        entityManager,
                        deferPublish: true,
                    }
                    let job: JobEntity
                    switch (submission.type) {
                    case SubmissionType.GithubUrl:
                        job = await this.enqueueProcessGitSubmissionJobService.enqueue({
                            ...enqueueParams,
                            lang: request.lang ?? userSubmission.selectedLang ?? undefined,
                        })
                        break
                    case SubmissionType.GoogleDocsUrl:
                        job =
                await this.enqueueProcessGoogleDocsSubmissionJobService.enqueue(
                    enqueueParams,
                )
                        break
                    default:
                        throw new SubmissionUrlInvalidException({
                            id: submission.id,
                            submissionType: submission.type,
                            url,
                        })
                    }
                    return {
                        submission,
                        attempt,
                        job,
                        replayed: false,
                    }
                }
                for (const deliverable of deliverables) {
                    records.push(await prepareDeliverable(deliverable,
                        records.length))
                }
                return records
            },
        )

        await Promise.all(
            prepared
                .filter((item) => !item.replayed)
                .map(async (item) => {
                    try {
                        if (item.submission.type === SubmissionType.GithubUrl) {
                            await this.enqueueProcessGitSubmissionJobService.publish(
                                item.job,
                            )
                        } else {
                            await this.enqueueProcessGoogleDocsSubmissionJobService.publish(
                                item.job,
                            )
                        }
                    } catch {
                        await this.entityManager.update(
                            UserChallengeSubmissionAttemptEntity,
                            {
                                id: item.attempt.id,
                                status: "evaluating",
                            },
                            {
                                status: "evaluation_unavailable",
                                uncertainty:
                  "Evaluation could not be queued. Your submitted attempt is preserved.",
                                nextAction: "Retry evaluation for this same attempt.",
                            },
                        )
                    }
                }),
        )
        const first = prepared[0]
        if (!first) {
            throw new ChallengeSubmissionCollectionIncompleteException({
                challengeId,
                expectedCount: expectedIds.length,
                completeCount: 0,
            })
        }
        return {
            jobId: first.job.id,
            attemptId: first.attempt.id,
            attemptGroupId,
            items: prepared.map((item) => ({
                challengeSubmissionId: item.submission.id,
                jobId: item.job.id,
                attemptId: item.attempt.id,
            })),
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
        if (
            selectedModel === undefined &&
      selectedModelProvider === undefined &&
      lang === undefined
        ) {
            return
        }
        if (selectedModel !== undefined) {
            userChallengeSubmission.selectedModel =
        validatedLane.gradingModel ?? null
        }
        if (selectedModelProvider !== undefined) {
            userChallengeSubmission.selectedModelProvider =
        validatedLane.gradingProvider ?? null
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
