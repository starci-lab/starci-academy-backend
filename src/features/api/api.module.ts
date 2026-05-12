import {
    Module,
    DynamicModule,
} from "@nestjs/common"
import {
    CoreModule,
} from "./core"
import {
    ConfigurableModuleClass, 
    OPTIONS_TYPE
} from "./api.module-definition"
import {
    ProcessorsModule 
} from "./processors"

/**
 * Module for the API.
 */
@Module({
    imports: [
        CoreModule.register({
            isGlobal: true,
        }),
        ProcessorsModule.register({
            isGlobal: true,
        }),
    ],
})
export class ApiModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        return {
            ...dynamicModule,
            module: ApiModule,
            imports: [
                ...(dynamicModule.imports ?? []),
                ...(
                    options.useCore ? [
                        CoreModule.register({
                            isGlobal: options.isGlobal,
                        })
                    ] : []
                ),
                ...(
                    options.useProcessors ? 
                        [
                            ProcessorsModule.register({
                                isGlobal: options.isGlobal,
                            })
                        ] : []
                ),
            ],
        }
    }
}