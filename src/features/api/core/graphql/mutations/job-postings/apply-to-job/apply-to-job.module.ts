import {
    Module,
} from "@nestjs/common"
import {
    ApplyToJobHandler,
} from "./apply-to-job.handler"
import {
    ApplyToJobResolver,
} from "./apply-to-job.resolver"
import {
    ApplyToJobService,
} from "./apply-to-job.service"
import {
    ConfigurableModuleClass,
} from "./apply-to-job.module-definition"

@Module({
    providers: [
        ApplyToJobHandler,
        ApplyToJobService,
        ApplyToJobResolver,
    ],
})
/** Wires internal job application submission. */
export class ApplyToJobSingleMutationModule extends ConfigurableModuleClass {}
