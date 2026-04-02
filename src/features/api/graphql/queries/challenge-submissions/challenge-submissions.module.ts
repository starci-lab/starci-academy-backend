import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./challenge-submissions.module-definition"
import {
    ChallengeSubmissionQueryModule,
} from "./challenge-submission"
import {
    ChallengeSubmissionsSingleQueryModule,
} from "./challenge-submissions"

@Module({
    imports: [
        ChallengeSubmissionQueryModule.register({
            isGlobal: true,
        }),
        ChallengeSubmissionsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class ChallengeSubmissionsModule extends ConfigurableModuleClass {}
