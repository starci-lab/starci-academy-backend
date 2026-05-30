import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    ChallengeSubmissionEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserChallengeSubmissionAttemptEntity,
    UserChallengeSubmissionEntity,
    UserEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    In,
    type EntityManager,
    type FindOptionsOrder,
} from "typeorm"
import {
    ChallengeSubmissionsQuery,
} from "./challenge-submissions.query"
import {
    ChallengeSubmissionsResponseData,
    ChallengeSubmissionsSortBy,
} from "./graphql-types"

@QueryHandler(ChallengeSubmissionsQuery)
@Injectable()
export class ChallengeSubmissionsHandler
    extends ICQRSHandler<ChallengeSubmissionsQuery, ChallengeSubmissionsResponseData>
    implements IQueryHandler<ChallengeSubmissionsQuery, ChallengeSubmissionsResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: ChallengeSubmissionsQuery,
    ): Promise<ChallengeSubmissionsResponseData> {
        const {
            request: {
                challengeId,
                filters: {
                    sorts,
                },
            },
            user,
        } = query.params

        const order: FindOptionsOrder<ChallengeSubmissionEntity> = {
        }
        for (const sort of sorts) {
            order[sort.by as ChallengeSubmissionsSortBy] = sort.order
        }

        const challengeSubmissions = await this.entityManager.find(
            ChallengeSubmissionEntity,
            {
                where: {
                    challenge: {
                        id: challengeId,
                    },
                },
                order,
                relations: {
                    translations: true,
                },
            },
        )

        if (user && challengeSubmissions.length) {
            await this.attachUserSubmissionForCurrentUser(
                challengeSubmissions,
                user,
            )
        }

        return {
            data: challengeSubmissions,
        }
    }

    /**
     * Attaches the latest user submission (and its last attempt) to each
     * submission row for the current user.
     */
    private async attachUserSubmissionForCurrentUser(
        submissions: Array<ChallengeSubmissionEntity>,
        user: UserEntity,
    ): Promise<void> {
        const submissionIds = submissions.map((s) => s.id)
        const joins = await this.entityManager.find(
            UserChallengeSubmissionEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                    submission: {
                        id: In(submissionIds),
                    },
                },
            },
        )

        const bySubmissionId = new Map(
            joins.map((join) => [
                join.submissionId,
                join,
            ]),
        )

        const lastAttempts = await this.entityManager.find(
            UserChallengeSubmissionAttemptEntity,
            {
                where: {
                    userChallengeSubmission: {
                        id: In(joins.map((join) => join.id)),
                    },
                },
                order: {
                    // Ascending so that when building the Map below (last write wins per key),
                    // the final entry per submission is the highest attempt number — i.e. the latest attempt.
                    attemptNumber: "ASC",
                },
            },
        )

        const byUserChallengeSubmissionId = new Map(
            lastAttempts.map((attempt) => [
                attempt.userChallengeSubmissionId,
                attempt,
            ]),
        )

        for (const submission of submissions) {
            submission.userSubmission = bySubmissionId.get(submission.id)
            if (submission.userSubmission) {
                submission.userSubmission.lastAttempt = byUserChallengeSubmissionId.get(submission.userSubmission.id)
            }
        }
    }
}
