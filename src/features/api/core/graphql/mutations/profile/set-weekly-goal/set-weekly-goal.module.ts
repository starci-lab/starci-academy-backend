import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./set-weekly-goal.module-definition"
import {
    SetWeeklyGoalResolver,
} from "./set-weekly-goal.resolver"

@Module({
    providers: [
        SetWeeklyGoalResolver,
    ],
})
/**
 * Registers weekly-goal write separately from weekly-challenge claim so
 * changing a target cannot accidentally trigger a payout.
 */
export class SetWeeklyGoalSingleMutationModule extends ConfigurableModuleClass {}
