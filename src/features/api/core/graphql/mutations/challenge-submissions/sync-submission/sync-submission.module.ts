import {
    ConfigurableModuleClass,
} from "./sync-submission.module-definition"
import {
    Module,
} from "@nestjs/common"
import {
    SyncSubmissionResolver,
} from "./sync-submission.resolver"
import {
    SyncSubmissionService,
} from "./sync-submission.service"
import {
    SyncSubmissionHandler,
} from "./sync-submission.handler"

@Module({
    providers: [
        SyncSubmissionService,
        SyncSubmissionResolver,
        SyncSubmissionHandler,
    ],
})
/**
 * Registers the draft-save leaf separately from enqueue-grading so the two
 * writes cannot be collapsed into one resolver that always spends quota.
 */
export class SyncSubmissionSingleMutationModule extends ConfigurableModuleClass {}
