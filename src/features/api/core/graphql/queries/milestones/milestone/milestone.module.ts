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
} from "@modules/integrations/elasticsearch/elasticsearch.module"

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
/**
 * Feature-module boundary for the `milestone` detail query -- imports
 * Elasticsearch and wires resolver, service, and handler.
 */
export class MilestoneSingleQueryModule extends ConfigurableModuleClass {}
