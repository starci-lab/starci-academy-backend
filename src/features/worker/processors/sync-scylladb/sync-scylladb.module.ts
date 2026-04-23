import {
    Module,
} from "@nestjs/common"
import {
    SyncScyllaDBWorker,
} from "./sync-scylladb.worker"
import {
    ConfigurableModuleClass,
} from "./sync-scylladb.module-definition"

@Module({
    providers: [
        SyncScyllaDBWorker,
    ],
})
export class SyncScyllaDBModule extends ConfigurableModuleClass {}
