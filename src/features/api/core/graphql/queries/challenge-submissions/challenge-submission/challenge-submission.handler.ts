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
                    // -- filter through the relations' real FK columns instead
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
