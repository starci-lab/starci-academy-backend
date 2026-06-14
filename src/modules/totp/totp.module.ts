import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./totp.module-definition"
import {
    TotpService,
} from "./totp.service"

/**
 * TOTP module — exposes {@link TotpService} for app-level two-factor auth.
 */
@Module({
    providers: [
        TotpService,
    ],
    exports: [
        TotpService,
    ],
})
export class TotpModule extends ConfigurableModuleClass {}
