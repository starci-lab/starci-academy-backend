import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./suggested-users.module-definition"
import {
    SuggestedUsersResolver,
} from "./suggested-users.resolver"

@Module({
    providers: [
        SuggestedUsersResolver,
    ],
})
export class SuggestedUsersSingleQueryModule extends ConfigurableModuleClass {}
