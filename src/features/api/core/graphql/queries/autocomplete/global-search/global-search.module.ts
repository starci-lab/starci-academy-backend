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
import {
    ChallengeGlobalSearchService,
    ContentGlobalSearchService,
    CourseGlobalSearchService,
    ModuleGlobalSearchService,
    FlashcardDeckGlobalSearchService,
    MilestoneGlobalSearchService,
    FoundationGlobalSearchService,
} from "./entities"

@Module({
    providers: [
        AutocompleteGlobalSearchResolver,
        AutocompleteGlobalSearchService,
        CourseGlobalSearchService,
        ModuleGlobalSearchService,
        ChallengeGlobalSearchService,
        ContentGlobalSearchService,
        FlashcardDeckGlobalSearchService,
        MilestoneGlobalSearchService,
        FoundationGlobalSearchService,
    ],
})
export class AutocompleteGlobalSearchSingleQueryModule extends ConfigurableModuleClass {}
