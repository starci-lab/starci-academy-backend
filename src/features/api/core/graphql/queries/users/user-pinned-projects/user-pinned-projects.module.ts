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
/** Feature-module boundary for the `userPinnedProjects` query — wires its resolver so the users group can mount this profile tab independently. */
export class UserPinnedProjectsSingleQueryModule extends ConfigurableModuleClass {}
