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
/**
 * Registers pin-order rewrite as its own leaf so a reorder cannot silently
 * add / drop pins the way a combined "set pins" mutation would.
 */
export class ReorderPinnedProjectsSingleMutationModule extends ConfigurableModuleClass {}
