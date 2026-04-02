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

@Module({
    providers: [
        ContentsService,
        ContentsResolver,
    ],
})
export class ContentsSingleQueryModule extends ConfigurableModuleClass {}
