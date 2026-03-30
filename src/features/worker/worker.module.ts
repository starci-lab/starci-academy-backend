import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./worker.module-definition"
import {
    ProcessorsModule,
} from "./processors"
import {
    RequeueModule,
} from "./requeue"

@Module({
    imports: [
        ProcessorsModule.register({
            isGlobal: true,
        }),
        RequeueModule,
    ],
})
export class WorkerModule extends ConfigurableModuleClass {}
