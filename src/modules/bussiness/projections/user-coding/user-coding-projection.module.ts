import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-coding-projection.module-definition"
import {
    UserCodingProjectionService,
} from "./user-coding-projection.service"
import {
    UserCodingProjectionListener,
} from "./user-coding-projection.listener"

@Module({
    providers: [
        UserCodingProjectionService,
        UserCodingProjectionListener,
    ],
    exports: [
        UserCodingProjectionService,
    ],
})
/**
 * Leaf module for the per-user coding-practice projection (recompute service +
 * CDC listener on `coding_submissions`). Exports the service so the profile
 * skills + history reads (and any inline write path) can use it.
 */
export class UserCodingProjectionModule extends ConfigurableModuleClass {
}
