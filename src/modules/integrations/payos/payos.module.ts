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
