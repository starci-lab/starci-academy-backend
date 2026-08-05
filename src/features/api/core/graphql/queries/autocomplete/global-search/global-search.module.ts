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
} from "./entities/challenge.service"
import {
    ContentGlobalSearchService,
} from "./entities/content.service"
import {
    CourseGlobalSearchService,
} from "./entities/course.service"
import {
    FlashcardDeckGlobalSearchService,
} from "./entities/flashcard-deck.service"
import {
    FoundationGlobalSearchService,
} from "./entities/foundation.service"
import {
    MilestoneTaskGlobalSearchService,
} from "./entities/milestone-task.service"
import {
    MilestoneGlobalSearchService,
} from "./entities/milestone.service"
import {
    ModuleGlobalSearchService,
} from "./entities/module.service"

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
