import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./challenge-suggestions.module-definition"
import {
    ChallengeSuggestionsHandler,
} from "./challenge-suggestions.handler"
import {
    ChallengeSuggestionsResolver,
} from "./challenge-suggestions.resolver"
import {
    ChallengeSuggestionsService,
} from "./challenge-suggestions.service"

@Module({
    providers: [
        ChallengeSuggestionsService,
        ChallengeSuggestionsResolver,
        ChallengeSuggestionsHandler,
    ],
})
export class ChallengeSuggestionsSingleQueryModule extends ConfigurableModuleClass {}
