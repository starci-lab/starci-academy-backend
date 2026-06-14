import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-dashboard.module-definition"
import {
    MyDashboardResolver,
} from "./my-dashboard.resolver"

@Module({
    providers: [
        MyDashboardResolver,
    ],
})
export class MyDashboardSingleQueryModule extends ConfigurableModuleClass {}
