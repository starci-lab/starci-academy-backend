import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./elasticsearch-synchronizer.module-definition"
import {
    SyncModule,
} from "./sync"

@Module({
    imports: [
        SyncModule,
    ],
})
export class ElasticsearchSynchronizerModule extends ConfigurableModuleClass {}

