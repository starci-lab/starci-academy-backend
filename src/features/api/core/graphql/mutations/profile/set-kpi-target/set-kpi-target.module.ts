import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./set-kpi-target.module-definition"
import {
    SetKpiTargetResolver,
} from "./set-kpi-target.resolver"

@Module({
    providers: [
        SetKpiTargetResolver,
    ],
})
/**
 * Registers KPI-target write so goal-setting stays out of the claim-reward
 * leaves (setting a target must not pay out).
 */
export class SetKpiTargetSingleMutationModule extends ConfigurableModuleClass {}
