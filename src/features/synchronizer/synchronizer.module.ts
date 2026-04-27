import {
    Module,
} from "@nestjs/common"
import {
    CoreModule,
} from "./core"
import {
    ConfigurableModuleClass,
} from "./synchronizer.module-definition"
import {
    ProcessorsModule,
} from "./processors"

@Module({
    imports: [
        CoreModule.register(
            {
                isGlobal: true,
            }
        ),
        ProcessorsModule.register(
            {
                isGlobal: true,
            }
        ),
    ],
})
export class SynchronizerModule extends ConfigurableModuleClass {
}
