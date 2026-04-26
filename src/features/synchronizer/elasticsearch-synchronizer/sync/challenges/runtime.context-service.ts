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
    ElasticsearchEntityChallengesService,
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
        @Inject(REQUEST)
        private readonly request: ChallengeRuntimeContextRequest,
        private readonly asyncService: AsyncService,
        private readonly elasticsearchEntityChallenges: ElasticsearchEntityChallengesService,
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
        await this.elasticsearchEntityChallenges.indexById(
            this.request.id,
        )
    }
}
