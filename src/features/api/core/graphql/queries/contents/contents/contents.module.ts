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

@Module({
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
