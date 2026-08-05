import {
    ICQRSHandler
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserChallengeSubmissionAttemptEntity,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    type EntityManager,
    type FindOptionsOrder,
} from "typeorm"
import {
    UserChallengeSubmissionAttemptsQuery,
} from "./user-challenge-submission-attempts.query"
import {
    UserChallengeSubmissionAttemptsResponseData,
    UserChallengeSubmissionAttemptsSortBy,
} from "./graphql-types"
import {
    UserNotFoundException 
} from "@modules/exceptions"

@QueryHandler(UserChallengeSubmissionAttemptsQuery)
@Injectable()
/**
 * Paginated attempt history for the signed-in user on one challenge
 * submission. Missing user throws; a missing join row returns an empty page
 * instead of 404 — the UI can render "no attempts yet".
 */
export class UserChallengeSubmissionAttemptsHandler
    extends ICQRSHandler<UserChallengeSubmissionAttemptsQuery, UserChallengeSubmissionAttemptsResponseData>
    implements IQueryHandler<UserChallengeSubmissionAttemptsQuery, UserChallengeSubmissionAttemptsResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: UserChallengeSubmissionAttemptsQuery,
    ): Promise<UserChallengeSubmissionAttemptsResponseData> {
        const {
            user,
            request: {
                challengeSubmissionId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                },
            },
        } = query.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        const order: FindOptionsOrder<UserChallengeSubmissionAttemptEntity> = {
        }
        for (const sort of sorts) {
            order[sort.by as UserChallengeSubmissionAttemptsSortBy] = sort.order
        }

        const userChallengeSubmission = await this.entityManager.findOne(
            UserChallengeSubmissionEntity,
            {
                where: {
                    submission: {
                        id: challengeSubmissionId,
                    },
                    user: {
                        id: user.id,
                    },
                },
            },
        )
        if (!userChallengeSubmission) {
            return {
                data: [],
                count: 0,
            }
        }

        const [
            data,
            count,
        ] = await this.entityManager.findAndCount(
            UserChallengeSubmissionAttemptEntity,
            {
                where: {
                    userChallengeSubmission: {
                        id: userChallengeSubmission.id,
                    },
                },
                order,
                skip: pageNumber * limit,
                take: limit,
            },
        )
        return {
            data,
            count,
        }
    }
}
