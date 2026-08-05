import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./notification.module-definition"
import {
    NotificationService,
} from "./notification.service"
import {
    SocialDigestCronService,
} from "./social-digest-cron.service"
import {
    JobsModule,
} from "../jobs"

@Module({
    imports: [
        JobsModule,
    ],
    providers: [
        NotificationService,
        SocialDigestCronService,
    ],
    exports: [
        NotificationService,
    ],
})
/**
 * Bussiness module for per-user in-app notifications (create + realtime fan-out,
 * listing, unread count, read-state mutations) plus the daily activity-digest
 * email cron. {@link JobsModule} is imported so the cron can enqueue mail.
 */
export class NotificationModule extends ConfigurableModuleClass {
}
