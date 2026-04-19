import {
    Module,
} from "@nestjs/common"
import {
    SyncSubmissionsResolver,
} from "./sync-submissions.resolver"
import {
    SyncSubmissionsService,
} from "./sync-submissions.service"
import {
    SyncSubmissionsHandler,
} from "./sync-submissions.handler"

@Module({
    providers: [
        SyncSubmissionsService,
        SyncSubmissionsResolver,
        SyncSubmissionsHandler,
    ],
})
export class SyncSubmissionsMutationModule {}
