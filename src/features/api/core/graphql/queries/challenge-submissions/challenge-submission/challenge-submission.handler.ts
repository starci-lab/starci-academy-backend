import {
    ICQRSHandler
} from "@modules/cqrs"
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
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    ChallengeSubmissionQuery,
} from "./challenge-submission.query"

@QueryHandler(ChallengeSubmissionQuery)
@Injectable()
/**
 * Loads one challenge submission by id and, for the signed-in user, attaches
 * their join row with attempts (newest first) and nested feedbacks. Throws
 * if the user is missing or the submission id does not exist. Other users'
 * join rows are never attached.
 */
export class ChallengeSubmissionHandler
    extends ICQRSHandler<ChallengeSubmissionQuery, ChallengeSubmissionEntity>
    implements IQueryHandler<ChallengeSubmissionQuery, ChallengeSubmissionEntity> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: ChallengeSubmissionQuery,
    ): Promise<ChallengeSubmissionEntity> {
        const {
            request,
            user,
        } = query.params

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
            throw new ChallengeSubmissionNotFoundException({
                submissionId: request.challengeSubmissionId,
            })
        }

        const userSubmission = await this.entityManager.findOne(
            UserChallengeSubmissionEntity,
            {
                where: {
                    // userId / submissionId are @RelationId (virtual, not queryable)
                    // — filter through the relations' real FK columns instead
                    user: {
                        id: user.id,
                    },
                    submission: {
                        id: request.challengeSubmissionId,
                    },
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
