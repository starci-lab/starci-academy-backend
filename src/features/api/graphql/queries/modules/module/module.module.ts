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
import {
    ModuleHandler,
} from "./module.handler"

@Module({
    providers: [
        ModuleService,
        ModuleResolver,
        ModuleHandler,
    ],
})
export class ModuleSingleQueryModule extends ConfigurableModuleClass {}
