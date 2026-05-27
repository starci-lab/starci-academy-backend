import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./challenge-submissions.module-definition"
import {
    SubmitChallengeSubmissionSingleMutationModule,
} from "./submit-challenge-submission"
import {
    SyncSubmissionSingleMutationModule,
} from "./sync-submission"

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
export class ChallengeSubmissionsMutationsModule extends ConfigurableModuleClass {}
