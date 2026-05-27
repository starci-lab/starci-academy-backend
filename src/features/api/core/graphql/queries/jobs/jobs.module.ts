import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./jobs.module-definition"
import {
    IncompletedJobsSingleQueryModule,
} from "./incompleted-jobs"

@Module({
    imports: [
        IncompletedJobsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class JobsModule extends ConfigurableModuleClass {}
