import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./nowpayments.module-definition"
import {
    NowPaymentsClient,
} from "./nowpayments.client"

@Module({
})
export class NowPaymentsModule extends ConfigurableModuleClass {
    static register(
        options: typeof OPTIONS_TYPE,
    ): DynamicModule {
        // build the base dynamic module (carries the `global` flag)
        const dynamicModule = super.register(options)
        // expose the NOWPayments REST client and re-export it for consumers
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                NowPaymentsClient,
            ],
            exports: [
                NowPaymentsClient,
            ],
        }
    }
}
