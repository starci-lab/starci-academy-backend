import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./modules.module-definition"
import {
    ModulesResolver,
} from "./modules.resolver"
import {
    ModulesService,
} from "./modules.service"
import {
    ModulesHandler,
} from "./modules.handler"
import {
    ElasticsearchModule,
} from "@modules/elasticsearch"

@Module({
    imports: [
        ElasticsearchModule,
    ],
    providers: [
        ModulesService,
        ModulesResolver,
        ModulesHandler,
    ],
})
export class ModulesSingleQueryModule extends ConfigurableModuleClass {}
