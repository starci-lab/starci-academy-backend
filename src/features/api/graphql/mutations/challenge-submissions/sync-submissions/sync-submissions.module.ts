import {
    Module,
} from "@nestjs/common"
import {
    SyncSubmissionsResolver,
} from "./sync-submissions.resolver"
import {
    SyncSubmissionsService,
} from "./sync-submissions.service"

@Module({
    providers: [
        SyncSubmissionsService,
        SyncSubmissionsResolver,
    ],
})
export class SyncSubmissionsMutationModule {}
