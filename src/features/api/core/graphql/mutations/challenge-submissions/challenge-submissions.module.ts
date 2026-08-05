import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./challenge-submissions.module-definition"
import {
    SubmitChallengeSubmissionSingleMutationModule,
} from "./submit-challenge-submission/submit-challenge-submission.module"
import {
    SyncSubmissionSingleMutationModule,
} from "./sync-submission/sync-submission.module"

@Module({
    imports: [
        SyncSubmissionSingleMutationModule.register({
            isGlobal: true,
        }),
        SubmitChallengeSubmissionSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Challenge write-side group: sync the user row (URL / model) separately
 * from enqueue-grading so a draft save never spends quota.
 */
export class ChallengeSubmissionsMutationsModule extends ConfigurableModuleClass {}
