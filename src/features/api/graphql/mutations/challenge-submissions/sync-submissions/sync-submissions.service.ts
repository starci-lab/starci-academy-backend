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
    ) { }

    /**
     * Execute the service.
     * @param params - The parameters.
     * @param user - The authenticated user.
     * @returns The result.
     */
    async execute(
        {
            request,
            user,
        }: SyncSubmissionsParams,
    ): Promise<SyncSubmissionsResult> {
        // Validate user
        if (!user) {
            throw new UserNotFoundException(
                {
                },
            )
        }
        // Validate items
        const {
            items,
        } = request
        if (!items?.length) {
            return
        }
        // Upsert submissions
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
     * @param user - The authenticated user.
     * @param challengeSubmissionId - The challenge submission id.
     * @param url - The submission URL to store.
     * @returns The void.
     */
    private async upsertOne(
        {
            entityManager,
            user,
            challengeSubmissionId,
            url,
        }: UpsertSubmissionParams,
    ): Promise<void> {
        // Validate challenge submission
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
        // Validate submission URL
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
        // Upsert user challenge submission
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
