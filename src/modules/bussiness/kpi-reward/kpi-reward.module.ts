import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./kpi-reward.module-definition"
import {
    KpiRewardService,
} from "./kpi-reward.service"

/**
 * Weekly-KPI coin-reward business module. Exports {@link KpiRewardService} so
 * `setKpiTarget` can lower the anti-gaming floor and `claimKpiReward` /
 * `myKpis` can read floor + claimed state. The
 * {@link UserStatsProjectionService} it depends on is provided by the
 * globally-registered projections module.
 */
@Module({
    providers: [
        KpiRewardService,
    ],
    exports: [
        KpiRewardService,
    ],
})
export class KpiRewardModule extends ConfigurableModuleClass {}
