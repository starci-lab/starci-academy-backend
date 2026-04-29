import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./modules.module-definition"
import {
    ModuleSingleQueryModule,
} from "./module"
import {
    ModulesSingleQueryModule,
} from "./modules"

@Module({
    imports: [
        ModuleSingleQueryModule.register({
            isGlobal: true,
        }),
        ModulesSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class ModulesModule extends ConfigurableModuleClass {}
