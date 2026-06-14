import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./mark-notification-as-read.module-definition"
import {
    MarkNotificationAsReadResolver,
} from "./mark-notification-as-read.resolver"

@Module({
    providers: [
        MarkNotificationAsReadResolver,
    ],
})
export class MarkNotificationAsReadSingleMutationModule extends ConfigurableModuleClass {}
