import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./cdn-synchronizer.module-definition"
import {
    ProcessorsModule,
} from "./processors"

@Module({
    imports: [
        ProcessorsModule.register({
            isGlobal: true,
        }),
    ],
})
export class GithubWorkerModule extends ConfigurableModuleClass {}
