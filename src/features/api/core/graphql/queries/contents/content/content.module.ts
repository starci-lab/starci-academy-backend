import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./content.module-definition"
import {
    ContentResolver,
} from "./content.resolver"
import {
    ContentQueryService,
} from "./content.service"
import {
    ContentHandler,
} from "./content.handler"

@Module({
    providers: [
        ContentQueryService,
        ContentResolver,
        ContentHandler,
    ],
})
export class ContentSingleQueryModule extends ConfigurableModuleClass {}
