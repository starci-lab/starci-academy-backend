import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./system-config.module-definition"
import {
    SystemConfigResolver,
} from "./system-config.resolver"
import {
    SystemConfigService,
} from "./system-config.service"
import {
    SystemConfigHandler,
} from "./system-config.handler"

@Module({
    providers: [
        SystemConfigService,
        SystemConfigResolver,
        SystemConfigHandler,
    ],
})
/** Feature-module boundary for the public `systemConfig` query. */
export class SystemConfigSingleQueryModule
    extends ConfigurableModuleClass {}
