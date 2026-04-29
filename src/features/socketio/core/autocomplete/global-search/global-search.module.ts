import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./global-search.module-definition"
import {
    GlobalSearchGateway,
} from "./global-search.gateway"
import {
    GlobalSearchHandler,
    GlobalSearchService,
    CourseGlobalSearchService,
    ModuleGlobalSearchService,
    ChallengeGlobalSearchService,
    LessonVideoGlobalSearchService,
    ContentGlobalSearchService,
    GlobalSearchEntityUtilsService,
} from "./handle-global-search"

/**
 * Module providing Socket.IO global fuzzy search using CQRS + Elasticsearch.
 */
@Module({
    providers: [
        GlobalSearchGateway,
        GlobalSearchService,
        GlobalSearchHandler,
        CourseGlobalSearchService,
        ModuleGlobalSearchService,
        ChallengeGlobalSearchService,
        LessonVideoGlobalSearchService,
        ContentGlobalSearchService,
        GlobalSearchEntityUtilsService,
    ],
    exports: [
        GlobalSearchGateway,
        GlobalSearchService,
        GlobalSearchHandler,
    ],
})
export class GlobalSearchModule extends ConfigurableModuleClass {}

