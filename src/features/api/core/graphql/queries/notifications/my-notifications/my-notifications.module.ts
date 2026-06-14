import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-notifications.module-definition"
import {
    MyNotificationsResolver,
} from "./my-notifications.resolver"

@Module({
    providers: [
        MyNotificationsResolver,
    ],
})
export class MyNotificationsSingleQueryModule extends ConfigurableModuleClass {}
