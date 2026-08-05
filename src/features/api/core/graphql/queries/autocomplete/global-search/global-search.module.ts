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
    MilestoneTaskGlobalSearchService,
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
        MilestoneTaskGlobalSearchService,
        FoundationGlobalSearchService,
    ],
})
/**
 * Feature-module boundary for the `autocompleteGlobalSearch` query -- wires the
 * orchestrator plus per-entity ES searchers so each catalog kind runs in parallel.
 */
export class AutocompleteGlobalSearchSingleQueryModule extends ConfigurableModuleClass {}
