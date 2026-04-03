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
import type {
    EntityManager,
} from "typeorm"
import type {
    SyncSubmissionsParams,
    SyncSubmissionsResult,
    UpsertSubmissionParams,
} from "./types"
import {
    isSubmissionUrlValidForType,
} from "./utils/submission-url-regex"

/**
 * Service for syncing challenge submissions (URLs per submission type).
 */
@Injectable()
export class SyncSubmissionsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Execute the service.
     * @param params - The parameters.
     * @returns The void.
     */
    async execute(
        {
            request,
            user,
        }: SyncSubmissionsParams,
    ): Promise<SyncSubmissionsResult> {
        if (!user) {
            throw new UserNotFoundException(
                {
                },
            )
        }
        const {
            items,
        } = request
        if (!items?.length) {
            return
        }
        await this.entityManager.transaction(
            async (entityManager) => {
                for (const item of items) {
                    await this.upsertOne(
                        {
                            entityManager,
                            user,
                            challengeSubmissionId: item.id,
                            url: item.url,
                        },
                    )
                }
            },
        )
    }

    /**
     * Upsert a user challenge submission.
     * @param params - The parameters.
     * @returns The user challenge submission.
     */
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
            throw new ChallengeSubmissionNotFoundException(
                {
                    submissionId: challengeSubmissionId,
                },
            )
        }
        if (
            !isSubmissionUrlValidForType(
                challengeSubmission.type,
                url,
            )
        ) {
            throw new SubmissionUrlInvalidException(
                {
                    id: challengeSubmissionId,
                    submissionType: challengeSubmission.type,
                    url,
                },
            )
        }
        let userChallengeSubmission = await entityManager.findOne(
            UserChallengeSubmissionEntity,
            {
                where: {
                    userId: user.id,
                    submissionId: challengeSubmissionId,
                },
            },
        )
        if (userChallengeSubmission) {
            userChallengeSubmission.submissionUrl = url
        } else {
            userChallengeSubmission = entityManager.create(
                UserChallengeSubmissionEntity,
                {
                    userId: user.id,
                    submissionId: challengeSubmissionId,
                    submissionUrl: url,
                    attempts: 0,
                    score: 0,
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
