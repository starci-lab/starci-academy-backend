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
export class SetKpiTargetSingleMutationModule extends ConfigurableModuleClass {}
