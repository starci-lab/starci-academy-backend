import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./claim-weekly-challenge-reward.module-definition"
import {
    ClaimWeeklyChallengeRewardResolver,
} from "./claim-weekly-challenge-reward.resolver"

@Module({
    providers: [
        ClaimWeeklyChallengeRewardResolver,
    ],
})
export class ClaimWeeklyChallengeRewardSingleMutationModule extends ConfigurableModuleClass {}
