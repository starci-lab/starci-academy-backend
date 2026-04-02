import {
    Module,
} from "@nestjs/common"
import {
    SyncSubmissionUrlsResolver,
} from "./sync-submission-urls.resolver"
import {
    SyncSubmissionUrlsService,
} from "./sync-submission-urls.service"

@Module({
    providers: [
        SyncSubmissionUrlsService,
        SyncSubmissionUrlsResolver,
    ],
})
export class SyncSubmissionUrlsMutationModule {}
