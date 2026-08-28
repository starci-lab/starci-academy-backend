import {
    Module,
} from "@nestjs/common"
import {
    JobStatusHandler,
} from "./job-status.handler"
import {
    ConfigurableModuleClass,
} from "./job-status.module-definition"
import {
    JobStatusResolver,
} from "./job-status.resolver"
import {
    JobStatusService,
} from "./job-status.service"

@Module({
    providers: [
        JobStatusHandler,
        JobStatusResolver,
        JobStatusService,
    ],
})
/** Registers the isolated GraphQL job-status query capability. */
export class JobStatusSingleQueryModule extends ConfigurableModuleClass {}
