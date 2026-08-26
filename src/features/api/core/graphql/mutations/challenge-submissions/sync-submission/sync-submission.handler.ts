import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    ChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/challenge-submission.entity"
import {
    UserChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"
import {
    PostgreSqlAdvisoryLockService,
} from "@modules/databases/postgresql/primary/lock/postgresql-advisory-lock.service"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    ChallengeSubmissionNotFoundException,
} from "@modules/platform/exceptions/errors/courses/challenge-submission-not-found"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
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
    SyncSubmissionCommand,
} from "./sync-submission.command"
import type {
    ApplySelectedGradingLaneParams,
    ResolveOrCreateUserChallengeSubmissionParams,
    SyncSubmissionResult,
    UpsertSubmissionParams,
} from "./types/sync-submission"
import {
    UrlValidatorService,
} from "@modules/lib/validators/url.service"
import {
    GradingLaneValidationService,
} from "@modules/ai/grading-lane-validation.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    ChallengeDraftRevisionConflictException,
} from "@modules/platform/exceptions/errors/courses/challenge-draft-revision-conflict"

@CommandHandler(SyncSubmissionCommand)
@Injectable()
/** Handler for `SyncSubmissionCommand`. */
export class SyncSubmissionHandler
    extends ICQRSHandler<SyncSubmissionCommand, SyncSubmissionResult>
    implements ICommandHandler<SyncSubmissionCommand, SyncSubmissionResult> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly urlValidatorService: UrlValidatorService,
        private readonly postgreSqlAdvisoryLockService: PostgreSqlAdvisoryLockService,
        private readonly gradingLaneValidationService: GradingLaneValidationService,
        private readonly userService: UserService,
    ) {
        super()
    }

    /** Process the command. */
    protected override async process(
        command: SyncSubmissionCommand,
    ): Promise<SyncSubmissionResult> {
        const {
            request,
            user,
        } = command.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        const {
            id,
            url,
            selectedModel,
            selectedModelProvider,
            expectedDraftRevision,
        } = request
        return this.entityManager.transaction(async (entityManager) => {
            await this.postgreSqlAdvisoryLockService.acquireUserChallengeSubmissionXactLock(
                entityManager,
                user.id,
                id,
            )
            return this.upsertOne({
                entityManager,
                user,
                challengeSubmissionId: id,
                url,
                selectedModel,
                selectedModelProvider,
                expectedDraftRevision,
            })
        })
    }

    /** Upsert one user challenge submission row. */
    private async upsertOne(
        {
            entityManager,
            user,
            challengeSubmissionId,
            url,
            selectedModel,
            selectedModelProvider,
            expectedDraftRevision,
        }: UpsertSubmissionParams,
    ): Promise<SyncSubmissionResult> {
        const challengeSubmission = await entityManager.findOne(
            ChallengeSubmissionEntity,
            {
                where: {
                    id: challengeSubmissionId,
                },
                // walk submission -> challenge -> content -> module -> course so we can
                // key the row by enrollment (user x course) -- the anchor going forward
                relations: {
                    challenge: {
                        content: {
                            module: {
                                course: true,
                            },
                        },
                    },
                },
            },
        )
        if (!challengeSubmission) {
            throw new ChallengeSubmissionNotFoundException({
                submissionId: challengeSubmissionId,
            })
        }

        // resolve-or-create the trial enrollment for this user x course; set it on
        // the row going forward (we still set user_id during the re-key transition).
        const courseId = challengeSubmission.challenge?.content?.module?.courseId ?? null
        const enrollment = courseId
            ? await this.userService.resolveOrCreateTrialEnrollment(
                user.id,
                courseId,
            )
            : null

        // only validate a URL when one is actually being synced; a
        // selection-only sync (no url) skips validation so the row can be
        // created before the user pastes a link
        const hasUrl = typeof url === "string" && url.length > 0
        if (hasUrl) {
            await this.urlValidatorService.isValid({
                submissionId: challengeSubmissionId,
                submissionType: challengeSubmission.type,
                url,
            })
        }

        const userChallengeSubmission = await this.resolveOrCreateUserChallengeSubmission(
            {
                entityManager,
                user,
                challengeSubmissionId,
                hasUrl,
                url,
                enrollment,
            },
        )
        const currentRevision = userChallengeSubmission.draftRevision ?? 0
        if (expectedDraftRevision !== undefined && expectedDraftRevision !== currentRevision) {
            throw new ChallengeDraftRevisionConflictException({
                submissionId: challengeSubmissionId,
                expectedRevision: expectedDraftRevision,
                currentRevision,
            })
        }
        if (hasUrl) {
            userChallengeSubmission.submissionUrl = url as string
            userChallengeSubmission.draftRevision = currentRevision + 1
            userChallengeSubmission.draftUpdatedAt = new Date()
        }
        // backfill enrollment on a pre-existing row that predates the re-key
        if (enrollment && !userChallengeSubmission.enrollmentId) {
            userChallengeSubmission.enrollment = enrollment
        }
        // persist the grading model pick when provided
        await this.applySelectedGradingLane(userChallengeSubmission,
            {
                userId: user.id,
                selectedModel,
                selectedModelProvider,
            })
        await entityManager.save(
            UserChallengeSubmissionEntity,
            userChallengeSubmission,
        )
        return {
            draftRevision: userChallengeSubmission.draftRevision ?? 0,
            savedAt: userChallengeSubmission.draftUpdatedAt ?? null,
        }
    }

    /**
     * Resolve the existing user challenge submission row (patching its URL when a
     * new one was sent), or create one when this is the first sync for this user
     * x submission pair.
     * @param params - The entity manager, user/challenge anchors, URL state, and enrollment.
     */
    private async resolveOrCreateUserChallengeSubmission(
        {
            entityManager,
            user,
            challengeSubmissionId,
            hasUrl,
            url,
            enrollment,
        }: ResolveOrCreateUserChallengeSubmissionParams,
    ): Promise<UserChallengeSubmissionEntity> {
        const existing = await entityManager.findOne(
            UserChallengeSubmissionEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                    submission: {
                        id: challengeSubmissionId,
                    },
                },
            },
        )
        if (existing) {
            return existing
        }
        return entityManager.create(
            UserChallengeSubmissionEntity,
            {
                user: {
                    id: user.id,
                },
                submission: {
                    id: challengeSubmissionId,
                },
                // empty until the user pastes a link on a selection-only sync
                submissionUrl: hasUrl ? (url as string) : "",
                processed: false,
                draftRevision: 0,
                draftUpdatedAt: null,
                ...(enrollment
                    ? {
                        enrollment,
                    }
                    : {
                    }),
            },
        )
    }

    /**
     * Validate and persist the caller's grading model/provider selection, when
     * provided (a sync with neither field set is a no-op here).
     * @param userChallengeSubmission - The row to patch.
     * @param params - The user plus the client-sent picks (each possibly `undefined`).
     */
    private async applySelectedGradingLane(
        userChallengeSubmission: UserChallengeSubmissionEntity,
        {
            userId,
            selectedModel,
            selectedModelProvider,
        }: ApplySelectedGradingLaneParams,
    ): Promise<void> {
        if (selectedModel === undefined && selectedModelProvider === undefined) {
            return
        }
        const validatedLane = await this.gradingLaneValidationService.validate({
            userId,
            model: selectedModel,
            provider: selectedModelProvider,
        })
        if (selectedModel !== undefined) {
            userChallengeSubmission.selectedModel = validatedLane.gradingModel
                ?? null
        }
        if (selectedModelProvider !== undefined) {
            userChallengeSubmission.selectedModelProvider = validatedLane.gradingProvider
                ?? null
        }
    }
}
