import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./milestone-suggestions.module-definition"
import {
    MilestoneSuggestionsHandler,
} from "./milestone-suggestions.handler"
import {
    MilestoneSuggestionsResolver,
} from "./milestone-suggestions.resolver"
import {
    MilestoneSuggestionsService,
} from "./milestone-suggestions.service"

@Module({
    providers: [
        MilestoneSuggestionsService,
        MilestoneSuggestionsResolver,
        MilestoneSuggestionsHandler,
    ],
})
export class MilestoneSuggestionsSingleQueryModule extends ConfigurableModuleClass {}
