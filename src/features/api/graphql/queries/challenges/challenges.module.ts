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

@Module({
    imports: [
        ChallengesSingleQueryModule.register({
            isGlobal: true,
        }),
        ChallengeSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class ChallengesModule extends ConfigurableModuleClass {}
