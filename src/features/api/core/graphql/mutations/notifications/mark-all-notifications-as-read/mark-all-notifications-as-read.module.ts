import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./mark-all-notifications-as-read.module-definition"
import {
    MarkAllNotificationsAsReadResolver,
} from "./mark-all-notifications-as-read.resolver"

@Module({
    providers: [
        MarkAllNotificationsAsReadResolver,
    ],
})
export class MarkAllNotificationsAsReadSingleMutationModule extends ConfigurableModuleClass {}
