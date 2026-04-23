import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./system.module-definition"
import {
    SystemConfigQueryModule,
} from "./system-config"

@Module({
    imports: [
        SystemConfigQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class SystemModule extends ConfigurableModuleClass {}
