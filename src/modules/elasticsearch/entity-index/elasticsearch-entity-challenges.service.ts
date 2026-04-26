import {
    ChallengeEntity,
    ChallengeResolverService,
    ChallengeStepEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    ChallengeNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import _ from "lodash"
import {
    EntityManager,
} from "typeorm"
import {
    ElasticsearchService,
} from "../elasticsearch.service"

/**
 * Indexes a challenge and its steps to Elasticsearch (Vi + En).
 */
@Injectable()
export class ElasticsearchEntityChallengesService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly elasticsearch: ElasticsearchService,
        private readonly challengeResolver: ChallengeResolverService,
    ) {
    }

    /**
     * Load the challenge, hydrate steps, then index all locales.
     */
    async indexById(
        id: string,
    ): Promise<void> {
        const challenge = await this.entityManager.findOne(
            ChallengeEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!challenge) {
            throw new ChallengeNotFoundException(
                {
                    id,
                },
            )
        }
        const plainChallenge = challenge.toPlain<ChallengeEntity>()

        const steps = await this.entityManager.find(
            ChallengeStepEntity,
            {
                where: {
                    challenge: {
                        id: plainChallenge.id,
                    },
                },
                select: {
                    id: true,
                },
            },
        )

        const hydratedSteps = steps?.map(
            (
                step,
            ) => step.toPlain<ChallengeStepEntity>(),
        )
        plainChallenge.steps = hydratedSteps

        const locales = [
            Locale.Vi,
            Locale.En,
        ]
        for (const locale of locales) {
            const hydratedChallenge = _.cloneDeep(
                plainChallenge,
            )

            this.challengeResolver.transform(
                hydratedChallenge,
                locale,
                hydratedChallenge.defaultLocale ?? Locale.En,
            )

            const dataToIndex = _.omit(
                hydratedChallenge,
                ["translations"],
            )

            const indexedData = {
                ...dataToIndex,
                locale,
            }

            await this.elasticsearch.indexEntity(
                ChallengeEntity,
                indexedData,
                `${hydratedChallenge.id}-${locale}`,
            )
        }
    }
}
