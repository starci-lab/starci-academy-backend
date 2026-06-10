import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./foundation-category-suggestions.module-definition"
import {
    FoundationCategorySuggestionsHandler,
} from "./foundation-category-suggestions.handler"
import {
    FoundationCategorySuggestionsResolver,
} from "./foundation-category-suggestions.resolver"
import {
    FoundationCategorySuggestionsService,
} from "./foundation-category-suggestions.service"

@Module({
    providers: [
        FoundationCategorySuggestionsService,
        FoundationCategorySuggestionsResolver,
        FoundationCategorySuggestionsHandler,
    ],
})
export class FoundationCategorySuggestionsSingleQueryModule extends ConfigurableModuleClass {}
