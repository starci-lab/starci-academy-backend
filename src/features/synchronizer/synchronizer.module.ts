import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    CoreModule,
} from "./core"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./synchronizer.module-definition"
import {
    ProcessorsModule,
} from "./processors"
import { envConfig } from "@modules/env"

@Module({
})
export class SynchronizerModule extends ConfigurableModuleClass {
    static register(
        options: typeof OPTIONS_TYPE,
    ): DynamicModule {
        const dynamicModule = super.register(options)
        const imports = envConfig().services.synchronizer.enable ? (
            [
                CoreModule.register(
                    {
                        isGlobal: true,
                    }
                ),
                ProcessorsModule.register(
                    {
                        isGlobal: true,
                    }
                ),
            ]
        ) : []
        return {
            ...dynamicModule,
            imports: [
                ...dynamicModule.imports || [],
                ...imports,
            ],
        }
    }
}
