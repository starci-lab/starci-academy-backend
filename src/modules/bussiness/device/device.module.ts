import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./device.module-definition"
import {
    DeviceService,
} from "./device.service"

/**
 * Business module for device recording (audit + anti-cheat correlation). Wraps
 * {@link DeviceService} so it is reachable through the capability's own module —
 * per [[naming-and-structure]] §1/§6 — rather than registered as a raw provider
 * inside a single consumer module.
 */
@Module({
    providers: [
        DeviceService,
    ],
    exports: [
        DeviceService,
    ],
})
export class DeviceModule extends ConfigurableModuleClass {}
