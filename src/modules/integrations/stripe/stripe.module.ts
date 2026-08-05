import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./stripe.module-definition"
import {
    createStripeProvider,
} from "./stripe.providers"

@Module({
})
/**
 * Registers the Stripe SDK provider so card checkout/webhooks inject one shared
 * client (secret from the mount file) instead of `new Stripe()` per call.
 */
export class StripeModule extends ConfigurableModuleClass {
    static register(
        options: typeof OPTIONS_TYPE,
    ): DynamicModule {
        // build the base dynamic module (carries the `global` flag)
        const dynamicModule = super.register(options)
        // create the shared Stripe SDK provider
        const stripeSdkProvider = createStripeProvider()
        // merge the provider into the module and re-export it for consumers
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                stripeSdkProvider,
            ],
            exports: [
                stripeSdkProvider,
            ],
        }
    }
}
