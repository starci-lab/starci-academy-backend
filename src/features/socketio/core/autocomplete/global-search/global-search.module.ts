import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./global-search.module-definition"
import {
    GlobalSearchGateway,
} from "./global-search.gateway"
import {
    GlobalSearchHandler,
    GlobalSearchService,
} from "./handle-global-search"

/**
 * Module providing Socket.IO global fuzzy search using CQRS + Elasticsearch.
 */
@Module({
    providers: [
        GlobalSearchGateway,
        GlobalSearchService,
        GlobalSearchHandler,
    ],
    exports: [
        GlobalSearchGateway,
        GlobalSearchService,
        GlobalSearchHandler,
    ],
})
export class GlobalSearchModule extends ConfigurableModuleClass {}

