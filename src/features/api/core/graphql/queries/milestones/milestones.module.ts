import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./milestones.module-definition"
import {
    MilestonesSingleQueryModule,
} from "./milestones"

@Module({
    imports: [
        MilestonesSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class MilestonesModule extends ConfigurableModuleClass {}
