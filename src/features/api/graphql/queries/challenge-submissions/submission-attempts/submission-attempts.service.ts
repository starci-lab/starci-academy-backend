import {
    InjectPrimaryPostgreSQLEntityManager,
    SubmissionAttemptEntity,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
    type FindOptionsOrder,
} from "typeorm"
import {
    ExecuteParams,
} from "../../../../types"
import { 
    SubmissionAttemptsRequest, 
    SubmissionAttemptsResponseData, 
    SubmissionAttemptsSortBy 
} from "./graphql-types"

/**
 * Service for querying submission attempts.
 */
@Injectable()
export class SubmissionAttemptsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Entry: returns a list of submission attempts with pagination.
     *
     * @param params - Query parameters including filters, pagination, and locale.
     * @returns Paginated results and count.
     */
    async execute(
        {
            request: {
                challengeSubmissionId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                },
            },
        }: ExecuteParams<SubmissionAttemptsRequest>,
    ): Promise<SubmissionAttemptsResponseData> {
        const order: FindOptionsOrder<SubmissionAttemptEntity> = {
        }
        for (const sort of sorts) {
            order[sort.by as SubmissionAttemptsSortBy] = sort.order
        }

        const userChallengeSubmission = await this.entityManager.findOne(
            UserChallengeSubmissionEntity,
            {
                where: {
                    submission: {
                        id: challengeSubmissionId,
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
            count
        ] = await this.entityManager.findAndCount(
            SubmissionAttemptEntity,
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