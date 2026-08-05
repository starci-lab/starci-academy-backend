import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-contribution-calendar.module-definition"
import {
    MyContributionCalendarResolver,
} from "./my-contribution-calendar.resolver"

@Module({
    providers: [
        MyContributionCalendarResolver,
    ],
})
/** Feature-module boundary for the `myContributionCalendar` query — wires its resolver so the dashboard group can mount this widget independently. */
export class MyContributionCalendarSingleQueryModule extends ConfigurableModuleClass {}
