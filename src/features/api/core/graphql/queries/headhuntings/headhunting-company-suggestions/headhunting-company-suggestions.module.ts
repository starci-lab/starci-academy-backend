import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./headhunting-company-suggestions.module-definition"
import {
    HeadhuntingCompanySuggestionsHandler,
} from "./headhunting-company-suggestions.handler"
import {
    HeadhuntingCompanySuggestionsResolver,
} from "./headhunting-company-suggestions.resolver"
import {
    HeadhuntingCompanySuggestionsService,
} from "./headhunting-company-suggestions.service"

@Module({
    providers: [
        HeadhuntingCompanySuggestionsService,
        HeadhuntingCompanySuggestionsResolver,
        HeadhuntingCompanySuggestionsHandler,
    ],
})
/** Feature-module boundary for the `headhuntingCompanySuggestions` query -- wires its resolver + service + CQRS handler. */
export class HeadhuntingCompanySuggestionsSingleQueryModule extends ConfigurableModuleClass {}
