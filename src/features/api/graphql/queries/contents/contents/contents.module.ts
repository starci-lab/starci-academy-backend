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
} from "@modules/elasticsearch"
import {
    ScyllaDBModule,
} from "@modules/databases"

@Module({
    imports: [
        ElasticsearchModule,
        ScyllaDBModule,
    ],
    providers: [
        ContentsService,
        ContentsResolver,
        ContentsHandler,
    ],
})
export class ContentsSingleQueryModule extends ConfigurableModuleClass {}
