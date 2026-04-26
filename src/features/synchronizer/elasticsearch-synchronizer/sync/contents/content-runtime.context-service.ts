import {
    envConfig 
} from "@modules/env"
import {
    AsyncService,
} from "@modules/mixin"
import {
    Inject,
    Injectable,
    Scope,
} from "@nestjs/common"
import {
    REQUEST 
} from "@nestjs/core"
import {
    ElasticsearchEntityContentsService,
} from "@modules/elasticsearch"
import type {
    ContentRuntimeContextRequest
} from "./types"

@Injectable({
    scope: Scope.REQUEST,
    durable: true,
})
export class ContentRuntimeContextService {
    constructor(
        @Inject(REQUEST)
        private readonly request: ContentRuntimeContextRequest,
        private readonly asyncService: AsyncService,
        private readonly elasticsearchEntityContents: ElasticsearchEntityContentsService,
    ) {}

    /**
     * Run the sync cycle.
     */
    async run() {
        setInterval(
            async () => {
                await this.asyncService.safeRun(
                    async () => await this.process(),
                )
            },
            envConfig().services.elasticsearchSynchronizer.syncIntervalMs.contents.runtime,
        )
    }

    /**
     * Sync the content to Elasticsearch.
     */
    async process() {
        await this.elasticsearchEntityContents.indexById(
            this.request.id,
        )
    }
}
