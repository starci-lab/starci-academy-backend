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
} from "@modules/vaildators"
import {
    GradingLaneValidationService,
} from "@modules/ai"

/** Handler for `SyncSubmissionCommand`. */
@CommandHandler(SyncSubmissionCommand)
@Injectable()
export class SyncSubmissionHandler
    extends ICQRSHandler<SyncSubmissionCommand, SyncSubmissionResult>
    implements ICommandHandler<SyncSubmissionCommand, SyncSubmissionResult> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly urlValidatorService: UrlValidatorService,
        private readonly postgreSqlAdvisoryLockService: PostgreSqlAdvisoryLockService,
        private readonly gradingLaneValidationService: GradingLaneValidationService,
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
            selectedMode,
            selectedModel,
            selectedModelProvider,
            byokApiKey,
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
                selectedMode,
                selectedModel,
                selectedModelProvider,
                byokApiKey,
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
            selectedMode,
            selectedModel,
            selectedModelProvider,
            byokApiKey,
        }: UpsertSubmissionParams,
    ): Promise<void> {
        const challengeSubmission = await entityManager.findOne(
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
                },
            )
        }
        // persist the grading lane + model pick when provided
        const hasLaneSelection = selectedMode !== undefined
            || selectedModel !== undefined
            || selectedModelProvider !== undefined
            || byokApiKey !== undefined
        if (hasLaneSelection) {
            const validatedLane = await this.gradingLaneValidationService.validate({
                userId: user.id,
                mode: selectedMode,
                model: selectedModel,
                provider: selectedModelProvider,
                byokApiKey,
            })
            if (selectedMode !== undefined) {
                userChallengeSubmission.selectedMode = validatedLane.mode
            }
            if (selectedModel !== undefined) {
                userChallengeSubmission.selectedModel = validatedLane.gradingModel
                    ?? validatedLane.byokModel
                    ?? null
            }
            if (selectedModelProvider !== undefined) {
                userChallengeSubmission.selectedModelProvider = validatedLane.gradingProvider
                    ?? validatedLane.byokProvider
                    ?? null
            }
        }
        await entityManager.save(
            UserChallengeSubmissionEntity,
            userChallengeSubmission,
        )
    }
}
