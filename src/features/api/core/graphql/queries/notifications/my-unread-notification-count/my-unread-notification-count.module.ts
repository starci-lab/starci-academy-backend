import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-unread-notification-count.module-definition"
import {
    MyUnreadNotificationCountResolver,
} from "./my-unread-notification-count.resolver"

@Module({
    providers: [
        MyUnreadNotificationCountResolver,
    ],
})
export class MyUnreadNotificationCountSingleQueryModule extends ConfigurableModuleClass {}
