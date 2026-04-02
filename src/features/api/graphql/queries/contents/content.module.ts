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

@Module({
    providers: [
        ContentQueryService,
        ContentResolver,
    ],
})
export class ContentSingleQueryModule extends ConfigurableModuleClass {}
