import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./challenge-submissions.module-definition"
import {
    SyncSubmissionsMutationModule,
} from "./sync-submissions"

@Module({
    imports: [
        SyncSubmissionsMutationModule,
    ],
})
export class ChallengeSubmissionsMutationsModule extends ConfigurableModuleClass {}
