import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sync-ideal-text.module-definition"
import {
    SyncIdealTextResolver,
} from "./sync-ideal-text.resolver"
import {
    SyncIdealTextService,
} from "./sync-ideal-text.service"
import {
    SyncIdealTextHandler,
} from "./sync-ideal-text.handler"

@Module({
    providers: [
        SyncIdealTextResolver,
        SyncIdealTextService,
        SyncIdealTextHandler,
    ],
})
export class SyncIdealTextModule extends ConfigurableModuleClass {}
