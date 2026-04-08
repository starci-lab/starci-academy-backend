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
    InjectPrimaryPostgreSQLEntityManager
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
            envConfig().services.cdnSynchronizer.syncIntervalMs.challenges.runtime
        )
    }

    /**
     * Sync the challenge to the CDN.
     */
    async process() {
        // take the challenge
        const challenges = await this.entityManager.find(
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
        const hydratedChallenges = challenges?.map((challenge) => challenge.toPlain<ChallengeEntity>())  
        // take all steps related to the challenge
        for (const hydratedChallenge of hydratedChallenges) {
            const steps = await this.entityManager.find(
                ChallengeStepEntity,
                {
                    where: {
                        challengeId: hydratedChallenge.id,
                    },
                    relations: {
                        translations: true,
                    },
                }
            )
            hydratedChallenge.steps = steps?.map((step) => step.toPlain<ChallengeStepEntity>())
        }
        await this.elasticsearch.indexEntities(
            ChallengeEntity,
            hydratedChallenges
        )
    }
}