import {
    Module,
} from "@nestjs/common"
import {
    CdnSynchronizerModule,
} from "./cdn-synchronizer"
import {
    ElasticsearchSynchronizerModule,
} from "./elasticsearch-synchronizer"
// import {
//     ScyllaDBSynchronizerModule,
// } from "./scylladb-synchronizer"
import {
    ConfigurableModuleClass,
} from "./modules.module-definition"
import {
    BloomFiltersSynchronizerModule 
} from "./bloom-filters-synchronizer"

@Module({
    imports: [
        BloomFiltersSynchronizerModule.register(
            {
                isGlobal: true,
            }
        ),
        CdnSynchronizerModule.register(
            {
                isGlobal: true,
            }
        ),
        ElasticsearchSynchronizerModule.register(
            {
                isGlobal: true,
            }
        ),
        // ScyllaDBSynchronizerModule.register(
        //     {
        //         isGlobal: true,
        //     }
        // ),
    ],
})
export class ModulesModule extends ConfigurableModuleClass {
}
