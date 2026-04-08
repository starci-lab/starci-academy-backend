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

/**
 * Elasticsearch module.
 */
@Module({
})
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
            ],
            exports: [
                elasticsearchProvider,
                ElasticsearchService,
            ],
        }
    }
}

