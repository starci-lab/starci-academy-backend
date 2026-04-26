import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./cdn-synchronizer.module-definition"
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
