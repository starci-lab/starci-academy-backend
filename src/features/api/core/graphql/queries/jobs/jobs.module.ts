import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./jobs.module-definition"
import {
    IncompletedJobsQueryModule,
} from "./incompleted-jobs"

@Module({
    imports: [
        IncompletedJobsQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class JobsModule extends ConfigurableModuleClass {}
