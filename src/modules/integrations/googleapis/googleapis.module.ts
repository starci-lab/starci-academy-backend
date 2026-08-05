import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./googleapis.module-definition"
import {
    GoogleDriverAPIService,
} from "./google-driver-api.service"

@Module({
})
/**
 * Registers {@link GoogleDriverAPIService} so Google-Docs grading can export
 * plain text via a shared service-account client instead of each job building
 * its own `GoogleAuth`.
 */
export class GoogleApisModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const providers = [
            GoogleDriverAPIService,
        ]
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers || []),
                ...providers,
            ],
            exports: [
                ...providers,
            ],
        }
    }
}

