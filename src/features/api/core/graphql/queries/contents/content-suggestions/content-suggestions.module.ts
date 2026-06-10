import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./content-suggestions.module-definition"
import {
    ContentSuggestionsHandler,
} from "./content-suggestions.handler"
import {
    ContentSuggestionsResolver,
} from "./content-suggestions.resolver"
import {
    ContentSuggestionsService,
} from "./content-suggestions.service"

@Module({
    providers: [
        ContentSuggestionsService,
        ContentSuggestionsResolver,
        ContentSuggestionsHandler,
    ],
})
export class ContentSuggestionsSingleQueryModule extends ConfigurableModuleClass {}
