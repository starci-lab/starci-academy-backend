import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./reorder-pinned-projects.module-definition"
import {
    ReorderPinnedProjectsResolver,
} from "./reorder-pinned-projects.resolver"

@Module({
    providers: [
        ReorderPinnedProjectsResolver,
    ],
})
export class ReorderPinnedProjectsSingleMutationModule extends ConfigurableModuleClass {}
