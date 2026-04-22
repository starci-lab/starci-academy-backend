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
export class SyncSubmissionMutationModule {}
