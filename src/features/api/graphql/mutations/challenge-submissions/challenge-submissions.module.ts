import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./challenge-submissions.module-definition"
import {
    SubmitChallengeSubmissionsMutationModule,
} from "./submit-challenge-submissions"
import {
    SyncSubmissionsMutationModule,
} from "./sync-submissions"

@Module({
    imports: [
        SyncSubmissionsMutationModule,
        SubmitChallengeSubmissionsMutationModule,
    ],
})
export class ChallengeSubmissionsMutationsModule extends ConfigurableModuleClass {}
