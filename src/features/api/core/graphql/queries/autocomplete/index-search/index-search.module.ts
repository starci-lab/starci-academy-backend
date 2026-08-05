import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./index-search.module-definition"
import {
    IndexSearchResolver,
} from "./index-search.resolver"
import {
    IndexSearchService,
} from "./index-search.service"
import {
    IndexSearchHandler,
} from "./index-search.handler"

@Module({
    providers: [
        IndexSearchResolver,
        IndexSearchService,
        IndexSearchHandler,
    ],
})
/**
 * Feature-module boundary for the `indexSearch` query -- wires resolver + service +
 * handler and imports Elasticsearch + Cache locally (not assumed global here).
 */
export class IndexSearchSingleQueryModule extends ConfigurableModuleClass {}
