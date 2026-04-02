import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./challenge-submissions.module-definition"
import {
    SyncSubmissionUrlsMutationModule,
} from "./sync-submission-urls"

@Module({
    imports: [
        SyncSubmissionUrlsMutationModule,
    ],
})
export class ChallengeSubmissionsMutationsModule extends ConfigurableModuleClass {}
