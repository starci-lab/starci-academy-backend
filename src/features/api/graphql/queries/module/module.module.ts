import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./module.module-definition"
import {
    ModuleResolver,
} from "./module.resolver"
import {
    ModuleService,
} from "./module.service"

@Module({
    providers: [
        ModuleService,
        ModuleResolver,
    ],
})
export class ModuleSingleQueryModule extends ConfigurableModuleClass {}
