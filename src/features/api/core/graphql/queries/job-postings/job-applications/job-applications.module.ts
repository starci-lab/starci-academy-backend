import {
    Module,
} from "@nestjs/common"
import {
    JobApplicationsHandler,
} from "./job-applications.handler"
import {
    JobApplicationsResolver,
} from "./job-applications.resolver"
import {
    JobApplicationsService,
} from "./job-applications.service"
import {
    ConfigurableModuleClass,
} from "./job-applications.module-definition"

@Module({
    providers: [
        JobApplicationsHandler,
        JobApplicationsService,
        JobApplicationsResolver,
    ],
})
/** Wires the owner-scoped applicant list. */
export class JobApplicationsSingleQueryModule extends ConfigurableModuleClass {}
