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
import {
    ElasticsearchModule,
} from "@modules/elasticsearch"
import {
    CacheModule,
} from "@modules/cache"

@Module({
    imports: [
        ElasticsearchModule,
        CacheModule.register({
            isGlobal: true,
        }),
    ],
    providers: [
        IndexSearchResolver,
        IndexSearchService,
        IndexSearchHandler,
    ],
})
export class IndexSearchQueryModule extends ConfigurableModuleClass {}
