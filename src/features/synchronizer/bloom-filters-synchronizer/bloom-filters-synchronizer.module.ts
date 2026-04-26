import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./bloom-filters-synchronizer.module-definition"
import {
    SyncModule,
} from "./sync"

@Module({
    imports: [
        SyncModule.register({
            isGlobal: true,
        }),
    ],
})
export class CdnSynchronizerModule extends ConfigurableModuleClass {}
