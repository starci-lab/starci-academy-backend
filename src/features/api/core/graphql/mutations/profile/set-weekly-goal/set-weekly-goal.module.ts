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
export class SetWeeklyGoalSingleMutationModule extends ConfigurableModuleClass {}
