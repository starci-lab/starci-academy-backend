import {
    Module,
} from "@nestjs/common"
import {
    HealthModule,
} from "@modules/health"
import {
    ConfigurableModuleClass,
} from "./system-health-status.module-definition"
import {
    SystemHealthStatusResolver,
} from "./system-health-status.resolver"

@Module({
    imports: [
        HealthModule.register({
            isGlobal: true,
        }),
    ],
    providers: [
        SystemHealthStatusResolver,
    ],
})
export class SystemHealthStatusSingleQueryModule extends ConfigurableModuleClass {}
