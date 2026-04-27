import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./modules.module-definition"
import {
    ModuleSingleQueryModule,
} from "./module"

@Module({
    imports: [
        ModuleSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class ModulesModule extends ConfigurableModuleClass {}
