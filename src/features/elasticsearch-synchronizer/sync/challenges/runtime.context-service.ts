import {
    envConfig 
} from "@modules/env"
import {
    AsyncService, 
} from "@modules/mixin"
import {
    Inject,
    Injectable 
} from "@nestjs/common"
import {
    Scope 
} from "@nestjs/common"
import {
    REQUEST 
} from "@nestjs/core"
import {
    ChallengeEntity,
    ChallengeStepEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import type {
    ChallengeRuntimeContextRequest,
} from "./types"
import {
    ChallengeNotFoundException 
} from "@modules/exceptions"
import {
    ChallengeTransformerService 
} from "@features/api/graphql/utils/challenge-transformer.service"
import _ from "lodash"

@Injectable({
    scope: Scope.REQUEST,
    durable: true,
})
export class ChallengeRuntimeContextService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        @Inject(REQUEST)
        private readonly request: ChallengeRuntimeContextRequest,
        private readonly asyncService: AsyncService,
        private readonly elasticsearch: ElasticsearchService,
        private readonly challengeTransformer: ChallengeTransformerService,
    ) {
    }

    /**
     * Run the sync cycle.
     */
    async run() {
        setInterval(
            async () => {
                await this.asyncService.safeRun(
                    async () => await this.process()
                )
            },
            envConfig().services.elasticsearchSynchronizer.syncIntervalMs.challenges.runtime
        )
    }

    /**
     * Sync the challenge to the Elasticsearch.
     */
    async process() {
        // take the challenge
        const challenge = await this.entityManager.findOne(
            ChallengeEntity,
            {
                where: {
                    id: this.request.id,
                },
                relations: {
                    translations: true,
                },
            }
        )
        if (!challenge) {
            throw new ChallengeNotFoundException(
                {
                    id: this.request.id,
                },
            )
        }
        const plainChallenge = challenge.toPlain<ChallengeEntity>()

        // take all steps related to the challenge
        const steps = await this.entityManager.find(ChallengeStepEntity,
            {
                where: {
                    challenge: {
                        id: plainChallenge.id,
                    },
                },
                select: {
                    id: true,
                },
            })

        // hydrate to plain objects once
        const hydratedSteps = steps?.map((step) => step.toPlain<ChallengeStepEntity>())
        plainChallenge.steps = hydratedSteps

        // Sync each locale separately
        const locales = [Locale.Vi,
            Locale.En]
        for (const locale of locales) {
            // deep clone the plain objects to avoid mutating the original
            const hydratedChallenge = _.cloneDeep(plainChallenge)

            // transform the challenge clone for the current locale
            this.challengeTransformer.transform(
                hydratedChallenge,
                locale,
                hydratedChallenge.defaultLocale ?? Locale.En,
            )

            const { translations, ...dataToIndex } = hydratedChallenge

            // Use the original UUID for the 'id' field in the document body,
            // but use a composite key (uuid-locale) for the Elasticsearch document ID (_id).
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
