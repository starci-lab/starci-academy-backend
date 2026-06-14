import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./dashboard.module-definition"
import {
    MyDashboardSingleQueryModule,
} from "./my-dashboard"
import {
    MyFeedSingleQueryModule,
} from "./my-feed"

/**
 * Dashboard query group — logged-in home payloads (rail + cursor-paginated feed).
 */
@Module({
    imports: [
        MyDashboardSingleQueryModule.register({
            isGlobal: true,
        }),
        MyFeedSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class DashboardQueriesModule extends ConfigurableModuleClass {}
