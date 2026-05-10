import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./milestones.module-definition"
import {
    MilestoneSingleQueryModule,
} from "./milestone"
import {
    MilestonesSingleQueryModule,
} from "./milestones"

@Module({
    imports: [
        MilestoneSingleQueryModule.register({
            isGlobal: true,
        }),
        MilestonesSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class MilestonesModule extends ConfigurableModuleClass {}
