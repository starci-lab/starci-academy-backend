import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-xp.module-definition"
import {
    UserXpResolver,
} from "./user-xp.resolver"

@Module({
    providers: [
        UserXpResolver,
    ],
})
export class UserXpSingleQueryModule extends ConfigurableModuleClass {}
