import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    UserChallengeSubmissionAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission-attempt.entity"
import {
    UserChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    envConfig,
} from "@modules/platform/env/config"
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
    UserChallengeSubmissionAttemptsSortBy,
} from "./graphql-types/request"
import {
    UserChallengeSubmissionAttemptsResponseData,
} from "./graphql-types/response"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"

@QueryHandler(UserChallengeSubmissionAttemptsQuery)
@Injectable()
/**
 * Paginated attempt history for the signed-in user on one challenge
 * submission. Missing user throws; a missing join row returns an empty page
 * instead of 404 -- the UI can render "no attempts yet".
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
