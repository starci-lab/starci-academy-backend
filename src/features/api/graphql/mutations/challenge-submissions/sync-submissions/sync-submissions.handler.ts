import {
    ICQRSHandler,
} from "@modules/bussiness"
import {
    ChallengeSubmissionEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import {
    ChallengeSubmissionNotFoundException,
    SubmissionUrlInvalidException,
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
    SyncSubmissionsCommand,
} from "./sync-submissions.command"
import type {
    SyncSubmissionsResult,
    UpsertSubmissionParams,
} from "./types"
import {
    isSubmissionUrlValidForType,
} from "./utils/submission-url-regex"

@CommandHandler(SyncSubmissionsCommand)
@Injectable()
export class SyncSubmissionsHandler
    extends ICQRSHandler<SyncSubmissionsCommand, SyncSubmissionsResult>
    implements ICommandHandler<SyncSubmissionsCommand, SyncSubmissionsResult> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        command: SyncSubmissionsCommand,
    ): Promise<SyncSubmissionsResult> {
        const {
            request,
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({})
        }

        const {
            items,
        } = request
        if (!items?.length) {
            return
        }

        await this.entityManager.transaction(async (entityManager) => {
            for (const item of items) {
                await this.upsertOne({
                    entityManager,
                    user,
                    challengeSubmissionId: item.id,
                    url: item.url,
                })
            }
        })
    }

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

        if (
            !isSubmissionUrlValidForType(
                challengeSubmission.type,
                url,
            )
        ) {
            throw new SubmissionUrlInvalidException({
                id: challengeSubmissionId,
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
