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
/**
 * Root module for the `/job_notifications` Socket.IO namespace: wires the
 * gateway plus the subscribe-to-a-job feature module.
 */
export class JobNotificationsModule extends ConfigurableModuleClass {}

