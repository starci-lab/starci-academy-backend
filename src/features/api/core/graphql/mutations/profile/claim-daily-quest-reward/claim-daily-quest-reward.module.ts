import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./claim-daily-quest-reward.module-definition"
import {
    ClaimDailyQuestRewardResolver,
} from "./claim-daily-quest-reward.resolver"

@Module({
    providers: [
        ClaimDailyQuestRewardResolver,
    ],
})
/**
 * Registers daily-quest claim so streak / KPI / weekly claims stay distinct
 * leaves and cannot share one "claim anything" resolver.
 */
export class ClaimDailyQuestRewardSingleMutationModule extends ConfigurableModuleClass {}
