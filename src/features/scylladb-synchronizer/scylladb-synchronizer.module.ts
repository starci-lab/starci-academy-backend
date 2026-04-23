import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./scylladb-synchronizer.module-definition"
import {
    SyncModule,
} from "./sync"

@Module({
    imports: [
        SyncModule,
    ],
    exports: [
        SyncModule,
    ],
})
export class ScyllaDBSynchronizerModule extends ConfigurableModuleClass {}
