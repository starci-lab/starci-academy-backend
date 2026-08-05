import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./incompleted-jobs.module-definition"
import {
    IncompletedJobsResolver,
} from "./incompleted-jobs.resolver"
import {
    IncompletedJobsService,
} from "./incompleted-jobs.service"
import {
    IncompletedJobsHandler,
} from "./incompleted-jobs.handler"

@Module({
    providers: [
        IncompletedJobsService,
        IncompletedJobsResolver,
        IncompletedJobsHandler,
    ],
})
/**
 * Registers {@link IncompletedJobsResolver} as a leaf query module — the schema
 * discovers the `incompletedJobs` operation through this registration, per
 * [[naming-and-structure]] §5.
 */
export class IncompletedJobsSingleQueryModule
    extends ConfigurableModuleClass {}
