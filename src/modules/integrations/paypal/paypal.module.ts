import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./paypal.module-definition"
import {
    PaypalClient,
} from "./paypal.client"

@Module({
})
/**
 * Registers {@link PaypalClient} so Orders v2 create/capture/webhook verify share
 * one Axios + client-credentials client instead of each webhook minting tokens.
 */
export class PaypalModule extends ConfigurableModuleClass {
    static register(
        options: typeof OPTIONS_TYPE,
    ): DynamicModule {
        // build the base dynamic module (carries the `global` flag)
        const dynamicModule = super.register(options)
        // expose the PayPal REST client and re-export it for consumers
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                PaypalClient,
            ],
            exports: [
                PaypalClient,
            ],
        }
    }
}
