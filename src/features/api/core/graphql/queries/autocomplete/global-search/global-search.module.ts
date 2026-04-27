import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./global-search.module-definition"
import {
    AutocompleteGlobalSearchResolver,
} from "./autocomplete-global-search.resolver"
import {
    AutocompleteGlobalSearchService,
} from "./autocomplete-global-search.service"

@Module({
    providers: [
        AutocompleteGlobalSearchResolver,
        AutocompleteGlobalSearchService,
    ],
})
export class AutocompleteGlobalSearchQueryModule extends ConfigurableModuleClass {}

