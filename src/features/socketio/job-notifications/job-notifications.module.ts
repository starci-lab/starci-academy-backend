import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./job-notifications.module-definition"
import {
    JobNotificationsGateway,
} from "./job-notifications.gateway"
import {
    SubcribeJobNotificationModule,
} from "./subcribe"

@Module({
    imports: [
        SubcribeJobNotificationModule.register({
            isGlobal: true,
        }),
    ],
    providers: [
        JobNotificationsGateway,
    ],
})
export class JobNotificationsModule extends ConfigurableModuleClass {}

