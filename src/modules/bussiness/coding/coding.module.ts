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
    CodingSubmissionService,
} from "./coding-submission.service"

/**
 * Business module for the coding-practice feature: problem reads + submission
 * create/history. The judging job is enqueued via the (global) JobsModule's
 * enqueue service, so no extra wiring is needed here.
 */
@Module({
    providers: [
        CodingProblemService,
        CodingSubmissionService,
    ],
    exports: [
        CodingProblemService,
        CodingSubmissionService,
    ],
})
export class CodingModule extends ConfigurableModuleClass {}
