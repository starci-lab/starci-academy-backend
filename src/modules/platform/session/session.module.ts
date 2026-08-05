import {
    Module
} from "@nestjs/common"
import {
    JobsModule
} from "@modules/bussiness"
import {
    ConfigurableModuleClass
} from "./session.module-definition"
import {
    SessionService
} from "./session.service"

@Module({
    imports: [
        // provides EnqueueSendMailJobService for the new-device sign-in alert
        JobsModule,
    ],
    providers: [
        SessionService,
    ],
    exports: [
        SessionService,
    ],
})
/**
 * Exports SessionService (and pulls JobsModule) so sign-in can persist the session and
 * alert on new devices.
 */
export class SessionModule extends ConfigurableModuleClass {}
