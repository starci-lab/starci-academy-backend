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
import {
    ElasticsearchModule,
} from "@modules/elasticsearch"

@Module({
    imports: [
        ElasticsearchModule,
    ],
    providers: [
        MilestoneService,
        MilestoneResolver,
        MilestoneHandler,
    ],
})
export class MilestoneSingleQueryModule extends ConfigurableModuleClass {}
