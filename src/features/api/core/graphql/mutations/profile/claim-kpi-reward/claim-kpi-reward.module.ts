import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./claim-kpi-reward.module-definition"
import {
    ClaimKpiRewardResolver,
} from "./claim-kpi-reward.resolver"

@Module({
    providers: [
        ClaimKpiRewardResolver,
    ],
})
/**
 * Registers KPI-reward claim as its own Nest unit -- payout rules differ
 * from daily / weekly claims and must not share a resolver.
 */
export class ClaimKpiRewardSingleMutationModule extends ConfigurableModuleClass {}
