
import {
    DynamicModule, Module, Provider 
} from "@nestjs/common"
import {
    OPTIONS_TYPE, ConfigurableModuleClass 
} from "./winston.module-definition"
import {
    createConsoleOnlyWinstonProvider,
    createLokiOnlyWinstonProvider,
    createWinstonAndConsoleProvider,
} from "./winston.providers"
import {
    WinstonService 
} from "./winston.service"

@Module({
})
/**
 * Registers console/Loki Winston providers so services inject a typed logger instead of
 * Nest's Logger.
 */
export class WinstonModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const providers: Array<Provider> = [
            createConsoleOnlyWinstonProvider(),
            createLokiOnlyWinstonProvider(),
            createWinstonAndConsoleProvider(),
        ]
        return {
            ...dynamicModule,
            providers: [...dynamicModule.providers || [],
                ...providers,
                WinstonService,
            ],
            exports: [
                WinstonService,
            ],
        }
    }
}   
