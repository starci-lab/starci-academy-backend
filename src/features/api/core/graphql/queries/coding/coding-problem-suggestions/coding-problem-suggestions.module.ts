import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./coding-problem-suggestions.module-definition"
import {
    CodingProblemSuggestionsHandler,
} from "./coding-problem-suggestions.handler"
import {
    CodingProblemSuggestionsResolver,
} from "./coding-problem-suggestions.resolver"
import {
    CodingProblemSuggestionsService,
} from "./coding-problem-suggestions.service"

/**
 * Wires the `codingProblemSuggestions` typeahead query: resolver, the thin
 * bus-dispatch service, and the CQRS handler that runs the ES suggester.
 */
@Module({
    providers: [
        CodingProblemSuggestionsService,
        CodingProblemSuggestionsResolver,
        CodingProblemSuggestionsHandler,
    ],
})
export class CodingProblemSuggestionsSingleQueryModule extends ConfigurableModuleClass {}
