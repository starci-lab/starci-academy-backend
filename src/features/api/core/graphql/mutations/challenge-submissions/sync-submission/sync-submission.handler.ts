import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    ChallengeSubmissionEntity,
    InjectPrimaryPostgreSQLEntityManager,
    PostgreSqlAdvisoryLockService,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import {
    ChallengeSubmissionNotFoundException,
    UserNotFoundException,
} from "@modules/exceptions"
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
} from "./types"
import {
    UrlValidatorService,
} from "@modules/validators"
import {
    GradingLaneValidationService,
} from "@modules/ai"
import {
    UserService,
} from "@modules/bussiness"

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
                // walk submission → challenge → content → module → course so we can
                // key the row by enrollment (user × course) — the anchor going forward
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

        // resolve-or-create the trial enrollment for this user × course; set it on
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
