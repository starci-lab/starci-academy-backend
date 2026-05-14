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

        await this.urlValidatorService.isValid({
            submissionId: challengeSubmissionId,
            submissionType: challengeSubmission.type,
            url,
        })

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
            userChallengeSubmission.submissionUrl = url
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
                    submissionUrl: url,
                    processed: false,
                },
            )
        }
        await entityManager.save(
            UserChallengeSubmissionEntity,
            userChallengeSubmission,
        )
    }
}
