import {
    DynamicModule, Module 
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./sepay.module-definition"
import {
    createSepayProvider 
} from "./sepay.providers"

@Module({
})
/**
 * Registers the SePay PG SDK provider so VN bank-transfer checkout injects one
 * shared client (merchant + secret file) instead of constructing `SePayPgClient`
 * per request.
 */
export class SepayModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const sepaySdkProvider = createSepayProvider()
        return {
            ...dynamicModule,
            providers: [...(dynamicModule.providers ?? []),
                sepaySdkProvider],
            exports: [sepaySdkProvider],
        }
    }
}
