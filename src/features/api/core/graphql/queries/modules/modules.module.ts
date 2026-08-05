import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./modules.module-definition"
import {
    ModuleSingleQueryModule,
} from "./module/module.module"
import {
    ModulesSingleQueryModule,
} from "./modules/modules.module"
import {
    ModuleSuggestionsSingleQueryModule,
} from "./module-suggestions/module-suggestions.module"

@Module({
    imports: [
        ModuleSingleQueryModule.register({
            isGlobal: true,
        }),
        ModulesSingleQueryModule.register({
            isGlobal: true,
        }),
        ModuleSuggestionsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Modules query group -- detail, course list, and typeahead leaves. Registered
 * global so each leaf resolver is picked up by the schema.
 */
export class ModulesModule extends ConfigurableModuleClass {}
