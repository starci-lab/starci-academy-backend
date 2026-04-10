import {
    ChallengeSubmissionEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import {
    ChallengeSubmissionNotFoundException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import type {
    ChallengeSubmissionRequest,
} from "./graphql-types"
import type {
    ExecuteParams,
} from "../../../../types"

/**
 * Service for querying challenge submissions.
 */
@Injectable()
export class ChallengeSubmissionQueryService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Get a challenge submission by ID.
     * @param request - The request object containing the challenge submission ID.
     * @param user - The user object.
     * @returns The challenge submission entity.
     */
    async execute(
        {
            request,
            user
        }: ExecuteParams<ChallengeSubmissionRequest>,
    ): Promise<ChallengeSubmissionEntity> {
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        const submission = await this.entityManager.findOne(
            ChallengeSubmissionEntity,
            {
                where: {
                    id: request.challengeSubmissionId,
                },
            },
        )
        if (!submission) {
            throw new ChallengeSubmissionNotFoundException(
                {
                    submissionId: request.challengeSubmissionId,
                },
            )
        }
        const userSubmission = await this.entityManager.findOne(
            UserChallengeSubmissionEntity,
            {
                where: {
                    userId: user.id,
                    submissionId: request.challengeSubmissionId,
                },
                relations: {
                    attempts: {
                        feedbacks: true,
                    },
                },
                order: {
                    attempts: {
                        createdAt: "DESC",
                    },
                },
            },
        )

        if (userSubmission) {
            submission.userSubmission = userSubmission
        }
        return submission
    }
}
