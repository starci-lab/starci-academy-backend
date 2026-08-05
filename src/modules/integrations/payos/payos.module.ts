import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./payos.module-definition"
import {
    createPayosProvider,
} from "./payos.providers"

@Module({
})
/**
 * Registers the PayOS SDK provider so VN checkout/webhooks inject one shared
 * client (apiKey + checksum + clientId) instead of constructing `new PayOS()`
 * per call.
 */
export class PayOSModule extends ConfigurableModuleClass {
    static register(
        options: typeof OPTIONS_TYPE,
    ): DynamicModule {
        const dynamicModule = super.register(options)
        const payosSdkProvider = createPayosProvider()
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                payosSdkProvider,
            ],
            exports: [
                payosSdkProvider,
            ],
        }
    }
}
