import {
    Module
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "./session.module-definition"
import {
    SessionService
} from "./session.service"

@Module({
    providers: [
        SessionService,
    ],
    exports: [
        SessionService,
    ],
})
/**
 * Exports SessionService so sign-in can persist the session and alert on new
 * devices. `EnqueueSendMailJobService` resolves from the globally registered
 * `JobsModule` / `BussinessModule` at the app root -- do not re-import it here.
 */
export class SessionModule extends ConfigurableModuleClass {}
