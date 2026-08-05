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
        } = request
        await this.entityManager.transaction(async (entityManager) => {
            await this.postgreSqlAdvisoryLockService.acquireUserChallengeSubmissionXactLock(
                entityManager,
                user.id,
                id,
            )
            await this.upsertOne({
                entityManager,
                user,
                challengeSubmissionId: id,
                url,
                selectedModel,
                selectedModelProvider,
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
        }: UpsertSubmissionParams,
    ): Promise<void> {
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

        let userChallengeSubmission = await entityManager.findOne(
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
        if (userChallengeSubmission) {
            if (hasUrl) {
                userChallengeSubmission.submissionUrl = url as string
            }
        } else {
            userChallengeSubmission = entityManager.create(
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
                    ...(enrollment
                        ? {
                            enrollment,
                        }
                        : {
                        }),
                },
            )
        }
        // backfill enrollment on a pre-existing row that predates the re-key
        if (enrollment && !userChallengeSubmission.enrollmentId) {
            userChallengeSubmission.enrollment = enrollment
        }
        // persist the grading model pick when provided
        const hasLaneSelection = selectedModel !== undefined
            || selectedModelProvider !== undefined
        if (hasLaneSelection) {
            const validatedLane = await this.gradingLaneValidationService.validate({
                userId: user.id,
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
        await entityManager.save(
            UserChallengeSubmissionEntity,
            userChallengeSubmission,
        )
    }
}
