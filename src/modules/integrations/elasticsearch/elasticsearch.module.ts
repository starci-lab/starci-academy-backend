import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./elasticsearch.module-definition"
import {
    createElasticsearchProvider,
} from "./elasticsearch.providers"
import {
    ElasticsearchService,
} from "./elasticsearch.service"
import {
    ElasticsearchIndexResetService,
} from "./elasticsearch-index-reset.service"

@Module({
})
/**
 * Elasticsearch module.
 */
export class ElasticsearchModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const elasticsearchProvider = createElasticsearchProvider()

        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                elasticsearchProvider,
                ElasticsearchService,
                ElasticsearchIndexResetService,
            ],
            exports: [
                elasticsearchProvider,
                ElasticsearchService,
                ElasticsearchIndexResetService,
            ],
        }
    }
}

