import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-xp-projection.module-definition"
import {
    UserXpProjectionService,
} from "./user-xp-projection.service"
import {
    UserXpProjectionListener,
} from "./user-xp-projection.listener"

@Module({
    providers: [
        UserXpProjectionService,
        UserXpProjectionListener,
    ],
    exports: [
        UserXpProjectionService,
    ],
})
/**
 * Leaf module for the per-user XP projection (recompute service + CDC listener on
 * `xp_histories` + `users`). Exports the service so the profile XP read (and any
 * inline write path) can use it.
 */
export class UserXpProjectionModule extends ConfigurableModuleClass {
}
