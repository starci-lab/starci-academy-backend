import {
    Module,
} from "@nestjs/common"
import {
    ChallengeSingleQueryModule,
} from "./challenge"
import {
    ChallengesSingleQueryModule,
} from "./challenges"
import {
    ConfigurableModuleClass,
} from "./challenges.module-definition"
import {
    ChallengeSubmissionProgressModule,
} from "./challenge-submission-progress"

@Module({
    imports: [
        ChallengesSingleQueryModule.register({
            isGlobal: true,
        }),
        ChallengeSingleQueryModule.register({
            isGlobal: true,
        }),
        ChallengeSubmissionProgressModule,
    ],
})
export class ChallengesModule extends ConfigurableModuleClass {}
