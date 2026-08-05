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
/**
 * Registers weekly-challenge claim so its windowed payout cannot be mixed
 * with daily-quest or KPI claim leaves.
 */
export class ClaimWeeklyChallengeRewardSingleMutationModule extends ConfigurableModuleClass {}
