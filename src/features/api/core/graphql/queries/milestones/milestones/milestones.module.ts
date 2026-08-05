import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./milestones.module-definition"
import {
    MilestonesResolver,
} from "./milestones.resolver"
import {
    MilestonesService,
} from "./milestones.service"
import {
    MilestonesHandler,
} from "./milestones.handler"
import {
    ElasticsearchModule,
} from "@modules/elasticsearch"

@Module({
    imports: [
        ElasticsearchModule,
    ],
    providers: [
        MilestonesService,
        MilestonesResolver,
        MilestonesHandler,
    ],
})
/**
 * Feature-module boundary for the `milestones` list query — imports
 * Elasticsearch and wires resolver, service, and handler.
 */
export class MilestonesSingleQueryModule extends ConfigurableModuleClass {}
