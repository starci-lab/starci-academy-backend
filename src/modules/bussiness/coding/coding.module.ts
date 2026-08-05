import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./coding.module-definition"
import {
    CodingProblemService,
} from "./coding-problem.service"
import {
    CodingProgressService,
} from "./coding-progress.service"
import {
    CodingSubmissionService,
} from "./coding-submission.service"
import {
    DeviceModule,
} from "../device/device.module"

@Module({
    imports: [
        DeviceModule,
    ],
    providers: [
        CodingProblemService,
        CodingProgressService,
        CodingSubmissionService,
    ],
    exports: [
        CodingProblemService,
        CodingProgressService,
        CodingSubmissionService,
    ],
})
/**
 * Business module for the coding-practice feature: problem reads + submission
 * create/history. The judging job is enqueued via the (global) JobsModule's
 * enqueue service, so no extra wiring is needed here. Imports {@link DeviceModule}
 * for the device recorder consumed by the submission service.
 */
export class CodingModule extends ConfigurableModuleClass {}
