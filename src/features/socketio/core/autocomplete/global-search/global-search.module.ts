import {
    Module
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "./global-search.module-definition"
import {
    GlobalSearchGateway
} from "./global-search.gateway"
import {
    GlobalSearchHandler,
    GlobalSearchService,
    CourseGlobalSearchService,
    ModuleGlobalSearchService,
    ChallengeGlobalSearchService,
    ContentGlobalSearchService,
    GlobalSearchEntityUtilsService
} from "./handle-global-search"

@Module({
    providers: [
        GlobalSearchGateway,
        GlobalSearchService,
        GlobalSearchHandler,
        CourseGlobalSearchService,
        ModuleGlobalSearchService,
        ChallengeGlobalSearchService,
        ContentGlobalSearchService,
        GlobalSearchEntityUtilsService,
    ],
    exports: [
        GlobalSearchGateway,
        GlobalSearchService,
        GlobalSearchHandler,
    ]
})
/**
 * Wires the autocomplete global-search gateway plus per-entity ES searchers so a
 * typed query can fan out without each caller importing the leaf services.
 */
export class GlobalSearchModule extends ConfigurableModuleClass {}

