import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./milestone.module-definition"
import {
    MilestoneResolver,
} from "./milestone.resolver"
import {
    MilestoneService,
} from "./milestone.service"
import {
    MilestoneHandler,
} from "./milestone.handler"

@Module({
    providers: [
        MilestoneService,
        MilestoneResolver,
        MilestoneHandler,
    ],
})
export class MilestoneSingleQueryModule extends ConfigurableModuleClass {}
