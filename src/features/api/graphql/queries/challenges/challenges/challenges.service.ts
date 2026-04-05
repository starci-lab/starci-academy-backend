import {
    ChallengeEntity,
    ChallengeStepEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
    FindOptionsOrder,
} from "typeorm"
import {
    ChallengesRequest,
    ChallengesResponseData,
    ChallengesSortBy,
} from "./graphql-types"
import {
    envConfig,
} from "@modules/env"
import {
    ChallengeTransformerService,
} from "../../../utils"
import {
    ExecuteParams,
} from "../../../../types"

/**
 * Lists module challenges from primary PostgreSQL for GraphQL.
 */
@Injectable()
export class ChallengesService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly challengeTransformer: ChallengeTransformerService,
    ) {}

    async execute(
        {
            request: {
                moduleId,
                filters: {
                    limit = envConfig().services.api.pagination.page.limit,
                    pageNumber = 0,
                    sorts,
                },
            },
            locale,
        }: ExecuteParams<ChallengesRequest>,
    ): Promise<ChallengesResponseData> {
        const order: FindOptionsOrder<ChallengeEntity> = {
        }
        for (const sort of sorts) {
            order[sort.by as ChallengesSortBy] = sort.order
        }
        const [
            challenges,
            count,
        ] = await this.entityManager.findAndCount(
            ChallengeEntity,
            {
                where: {
                    module: {
                        id: moduleId,
                    },
                },
                order,
                relations: {
                    translations: true,
                },
                take: limit,
                skip: pageNumber * limit,
            },
        )
        for (const challenge of challenges) {
            challenge.steps = await this.entityManager.find(
                ChallengeStepEntity,
                {
                    where: {
                        challengeId: challenge.id,
                    },
                    relations: {
                        translations: true,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            )
            this.challengeTransformer.transform(
                challenge,
                locale,
                challenge.defaultLocale ?? Locale.En,
            )
        }
        return {
            count,
            data: challenges,
        }
    }
}
