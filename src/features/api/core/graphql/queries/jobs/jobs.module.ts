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
/**
 * Jobs query group -- status leaves for polling background job progress.
 * Currently the single `incompletedJobs` leaf; registered global so its
 * resolver is picked up by the schema.
 */
export class JobsModule extends ConfigurableModuleClass {}
