import {
    Module,
} from "@nestjs/common"
import {
    ModulesModule,
} from "./modules"
// import {
//     ScyllaDBSynchronizerModule,
// } from "./scylladb-synchronizer"
import {
    ConfigurableModuleClass,
} from "./synchronizer.module-definition"

@Module({
    imports: [
        ModulesModule.register(
            {
                isGlobal: true,
            }
        ),
        // ScyllaDBSynchronizerModule.register(
        //     {
        //         isGlobal: true,
        //     }
        // ),
    ],
})
export class SynchronizerModule extends ConfigurableModuleClass {
}
