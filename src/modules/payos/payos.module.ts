import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./payos.module-definition"
import {
    PayOSService,
} from "./payos.service"

@Module({})
export class PayOSModule extends ConfigurableModuleClass {
    static register(
        options: typeof OPTIONS_TYPE,
    ): DynamicModule {
        const dynamicModule = super.register(options)
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                PayOSService,
            ],
            exports: [
                PayOSService,
            ],
        }
    }
}
