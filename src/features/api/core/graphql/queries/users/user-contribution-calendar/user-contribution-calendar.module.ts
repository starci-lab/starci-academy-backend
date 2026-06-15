import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-contribution-calendar.module-definition"
import {
    UserContributionCalendarResolver,
} from "./user-contribution-calendar.resolver"

@Module({
    providers: [
        UserContributionCalendarResolver,
    ],
})
export class UserContributionCalendarSingleQueryModule extends ConfigurableModuleClass {}
