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
            throw new UserNotFoundException({})
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
