import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-capstone-projection.module-definition"
import {
    UserCapstoneProjectionService,
} from "./user-capstone-projection.service"
import {
    UserCapstoneProjectionListener,
} from "./user-capstone-projection.listener"

@Module({
    providers: [
        UserCapstoneProjectionService,
        UserCapstoneProjectionListener,
    ],
    exports: [
        UserCapstoneProjectionService,
    ],
})
/**
 * Leaf module for the per-user capstone-tasks projection (recompute service + CDC
 * listener on `user_milestone_task_attempts`). Exports the service so the profile
 * capstone read (and any inline write path) can use it.
 */
export class UserCapstoneProjectionModule extends ConfigurableModuleClass {
}
