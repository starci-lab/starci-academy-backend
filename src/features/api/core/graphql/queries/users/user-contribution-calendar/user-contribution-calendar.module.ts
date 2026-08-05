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
/** Feature-module boundary for the `userContributionCalendar` query — wires its resolver so the users group can mount this profile tab independently. */
export class UserContributionCalendarSingleQueryModule extends ConfigurableModuleClass {}
