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
export class IncompletedJobsQueryModule
    extends ConfigurableModuleClass {}
