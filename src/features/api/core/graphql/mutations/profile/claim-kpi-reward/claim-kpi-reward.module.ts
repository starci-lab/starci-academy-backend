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
export class ClaimKpiRewardSingleMutationModule extends ConfigurableModuleClass {}
