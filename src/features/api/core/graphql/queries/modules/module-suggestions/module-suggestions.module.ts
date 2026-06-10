import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./module-suggestions.module-definition"
import {
    ModuleSuggestionsHandler,
} from "./module-suggestions.handler"
import {
    ModuleSuggestionsResolver,
} from "./module-suggestions.resolver"
import {
    ModuleSuggestionsService,
} from "./module-suggestions.service"

@Module({
    providers: [
        ModuleSuggestionsService,
        ModuleSuggestionsResolver,
        ModuleSuggestionsHandler,
    ],
})
export class ModuleSuggestionsSingleQueryModule extends ConfigurableModuleClass {}
