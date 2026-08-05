import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./consultant-suggestions.module-definition"
import {
    ConsultantSuggestionsHandler,
} from "./consultant-suggestions.handler"
import {
    ConsultantSuggestionsResolver,
} from "./consultant-suggestions.resolver"
import {
    ConsultantSuggestionsService,
} from "./consultant-suggestions.service"

@Module({
    providers: [
        ConsultantSuggestionsService,
        ConsultantSuggestionsResolver,
        ConsultantSuggestionsHandler,
    ],
})
/** Feature-module boundary for the `consultantSuggestions` query -- wires its resolver + service + CQRS handler. */
export class ConsultantSuggestionsSingleQueryModule extends ConfigurableModuleClass {}
