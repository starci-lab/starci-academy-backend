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
import {
    MilestoneSuggestionsSingleQueryModule,
} from "./milestone-suggestions"

@Module({
    imports: [
        MilestoneSingleQueryModule.register({
            isGlobal: true,
        }),
        MilestonesSingleQueryModule.register({
            isGlobal: true,
        }),
        MilestoneSuggestionsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class MilestonesModule extends ConfigurableModuleClass {}
