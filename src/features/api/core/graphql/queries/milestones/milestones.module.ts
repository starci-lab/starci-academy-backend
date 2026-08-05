import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./milestones.module-definition"
import {
    MilestoneSingleQueryModule,
} from "./milestone/milestone.module"
import {
    MilestonesSingleQueryModule,
} from "./milestones/milestones.module"
import {
    MilestoneSuggestionsSingleQueryModule,
} from "./milestone-suggestions/milestone-suggestions.module"

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
/**
 * Milestones query group -- detail, course list, and typeahead leaves.
 * Registered global so each leaf resolver is picked up by the schema.
 */
export class MilestonesModule extends ConfigurableModuleClass {}
