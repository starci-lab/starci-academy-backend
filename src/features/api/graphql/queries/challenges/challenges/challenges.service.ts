import {
    ChallengeEntity,
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
                filters: {
                    moduleId,
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
            rows,
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
                    inputs: {
                        translations: true,
                    },
                    steps: {
                        translations: true,
                    },
                    references: {
                        translations: true,
                    },
                },
                take: limit,
                skip: pageNumber * limit,
            },
        )
        for (const challenge of rows) {
            const fallbackLocale = challenge.defaultLocale ?? Locale.En
            this.challengeTransformer.transform(
                challenge,
                locale,
                fallbackLocale,
            )
        }
        return {
            count,
            data: rows,
        }
    }
}
