// app.module.ts
import {
    DynamicModule, Module 
} from "@nestjs/common"
import {
    ConfigurableModuleClass, OPTIONS_TYPE 
} from "./axios.module-definition"   
import {
    AxiosService 
} from "./axios.service"

@Module({
})
/**
 * Shared Axios factory so outbound HTTP clients (captcha, PayPal, NOWPayments, …)
 * reuse one retry-configured instance per key instead of each constructing a
 * naked `axios.create()` that would ignore house timeouts/retries.
 */
export class AxiosModule extends ConfigurableModuleClass {
    static register(
        options: typeof OPTIONS_TYPE
    ): DynamicModule {
        const dynamicModule = super.register(options)
        const providers = [
            AxiosService,
        ]
        return {
            ...dynamicModule,
            providers: [
                ...dynamicModule.providers || [],
                ...providers,
            ],
            exports: [
                ...providers,
            ],
        }
    }
}