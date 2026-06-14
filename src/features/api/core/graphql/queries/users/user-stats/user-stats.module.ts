import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-stats.module-definition"
import {
    UserStatsResolver,
} from "./user-stats.resolver"

@Module({
    providers: [
        UserStatsResolver,
    ],
})
export class UserStatsSingleQueryModule extends ConfigurableModuleClass {}
