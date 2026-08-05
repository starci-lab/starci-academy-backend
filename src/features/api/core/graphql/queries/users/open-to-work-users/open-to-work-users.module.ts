import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./open-to-work-users.module-definition"
import {
    OpenToWorkUsersResolver,
} from "./open-to-work-users.resolver"

@Module({
    providers: [
        OpenToWorkUsersResolver,
    ],
})
/** Feature-module boundary for the `openToWorkUsers` query — wires its resolver so the users group can mount this profile tab independently. */
export class OpenToWorkUsersSingleQueryModule extends ConfigurableModuleClass {}
