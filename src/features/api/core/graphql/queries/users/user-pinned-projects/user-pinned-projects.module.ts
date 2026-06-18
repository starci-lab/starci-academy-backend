import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-pinned-projects.module-definition"
import {
    UserPinnedProjectsResolver,
} from "./user-pinned-projects.resolver"

@Module({
    providers: [
        UserPinnedProjectsResolver,
    ],
})
export class UserPinnedProjectsSingleQueryModule extends ConfigurableModuleClass {}
