import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./content-status.module-definition"
import {
    ContentStatusResolver,
} from "./content-status.resolver"
import {
    ContentStatusService,
} from "./content-status.service"
import {
    ContentStatusHandler,
} from "./content-status.handler"

@Module({
    providers: [
        ContentStatusResolver,
        ContentStatusService,
        ContentStatusHandler,
    ],
})
export class ContentStatusSingleQueryModule extends ConfigurableModuleClass {}
