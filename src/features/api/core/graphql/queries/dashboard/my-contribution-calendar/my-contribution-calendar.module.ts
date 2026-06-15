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
export class MyContributionCalendarSingleQueryModule extends ConfigurableModuleClass {}
