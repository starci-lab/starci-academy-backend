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
export class ClaimDailyQuestRewardSingleMutationModule extends ConfigurableModuleClass {}
