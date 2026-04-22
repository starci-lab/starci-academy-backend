import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./challenge-submissions.module-definition"
import {
    SubmitChallengeSubmissionMutationModule,
} from "./submit-challenge-submission"
import {
    SyncSubmissionMutationModule,
} from "./sync-submission"

@Module({
    imports: [
        SyncSubmissionMutationModule,
        SubmitChallengeSubmissionMutationModule,
    ],
})
export class ChallengeSubmissionsMutationsModule extends ConfigurableModuleClass {}
