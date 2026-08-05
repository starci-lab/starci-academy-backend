import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-pinned-projects-projection.module-definition"
import {
    UserPinnedProjectsProjectionService,
} from "./user-pinned-projects-projection.service"
import {
    UserPinnedProjectsProjectionListener,
} from "./user-pinned-projects-projection.listener"

@Module({
    providers: [
        UserPinnedProjectsProjectionService,
        UserPinnedProjectsProjectionListener,
    ],
    exports: [
        UserPinnedProjectsProjectionService,
    ],
})
/**
 * Leaf module for the per-user pinned-projects projection (recompute service +
 * CDC listener on `user_pinned_projects`, `enrollments`, `courses`). Exports the
 * service so the public-profile pinned-projects read (and any inline write path)
 * can use it.
 */
export class UserPinnedProjectsProjectionModule extends ConfigurableModuleClass {
}
