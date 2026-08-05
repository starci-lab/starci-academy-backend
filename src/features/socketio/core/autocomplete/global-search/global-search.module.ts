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
    ChallengeGlobalSearchService,
} from "./handle-global-search/entities/challenge.service"
import {
    ContentGlobalSearchService,
} from "./handle-global-search/entities/content.service"
import {
    CourseGlobalSearchService,
} from "./handle-global-search/entities/course.service"
import {
    ModuleGlobalSearchService,
} from "./handle-global-search/entities/module.service"
import {
    GlobalSearchEntityUtilsService,
} from "./handle-global-search/entities/utils.service"
import {
    GlobalSearchHandler,
} from "./handle-global-search/global-search.handler"
import {
    GlobalSearchService,
} from "./handle-global-search/global-search.service"

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

