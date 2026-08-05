import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./totp.module-definition"
import {
    TotpService,
} from "./totp.service"

@Module({
    providers: [
        TotpService,
    ],
    exports: [
        TotpService,
    ],
})
/**
 * TOTP module -- exposes {@link TotpService} for app-level two-factor auth.
 */
export class TotpModule extends ConfigurableModuleClass {}
