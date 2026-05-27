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
export class SyncSubmissionSingleMutationModule extends ConfigurableModuleClass {}
