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
    DeviceService,
} from "../device"

/**
 * Business module for the coding-practice feature: problem reads + submission
 * create/history. The judging job is enqueued via the (global) JobsModule's
 * enqueue service, so no extra wiring is needed here. Also wires the device
 * recorder consumed by the submission service.
 */
@Module({
    providers: [
        CodingProblemService,
        CodingProgressService,
        CodingSubmissionService,
        DeviceService,
    ],
    exports: [
        CodingProblemService,
        CodingProgressService,
        CodingSubmissionService,
        DeviceService,
    ],
})
export class CodingModule extends ConfigurableModuleClass {}
