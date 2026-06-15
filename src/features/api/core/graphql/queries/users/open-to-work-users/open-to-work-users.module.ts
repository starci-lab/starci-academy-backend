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
export class OpenToWorkUsersSingleQueryModule extends ConfigurableModuleClass {}
