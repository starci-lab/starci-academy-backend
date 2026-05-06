import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./init.module-definition"
import {
    InitService,
} from "./init.service"
import {
    SeedersModule,
} from "./seeders"
import {
    SynchronizersModule,
} from "./synchronizers"

/**
 * Init module — plugin-based initialization orchestrator.
 *
 * Imports Seeders and Synchronizers sub-modules, then runs
 * enabled plugins sequentially via {@link InitService}.
 */
@Module({
})
export class InitModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)

        return {
            ...dynamicModule,
            imports: [
                ...(dynamicModule.imports ?? []),
                SeedersModule,
                SynchronizersModule.register({
                    isGlobal: true,
                }),
            ],
            providers: [
                ...(dynamicModule.providers ?? []),
                InitService,
            ],
            exports: [
                InitService,
            ],
        }
    }
}
