import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./contents.module-definition"
import {
    ContentsResolver,
} from "./contents.resolver"
import {
    ContentsService,
} from "./contents.service"
import {
    ContentsHandler,
} from "./contents.handler"
import {
    ElasticsearchModule,
} from "@modules/integrations/elasticsearch/elasticsearch.module"

@Module({
    imports: [
        ElasticsearchModule,
    ],
    providers: [
        ContentsService,
        ContentsResolver,
        ContentsHandler,
    ],
})
/**
 * Nest DI for `contents` -- includes ElasticsearchModule for the paginated list.
 */
export class ContentsSingleQueryModule extends ConfigurableModuleClass {}
