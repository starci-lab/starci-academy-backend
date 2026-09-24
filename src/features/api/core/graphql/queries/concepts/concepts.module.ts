import {
    Module,
} from "@nestjs/common"
import {
    ConceptApiService,
} from "./concept-api.service"
import {
    ConceptWorkspaceSourceService,
} from "./concept-workspace-source.service"
import {
    ConfigurableModuleClass,
} from "./concepts.module-definition"
import {
    ConceptsResolver,
} from "./concepts.resolver"

@Module({
    providers: [
        ConceptApiService,
        ConceptWorkspaceSourceService,
        ConceptsResolver,
    ],
    exports: [
        ConceptApiService,
        ConceptWorkspaceSourceService,
    ],
})
/** Standalone read-only Concepts API module with no course/search dependencies. */
export class ConceptsQueriesModule extends ConfigurableModuleClass {}
