import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./init.module-definition"
import {
    LegacyInitService,
} from "./init.service"
import {
    ScopeModule,
    SeedersModule,
    SynchronizersModule,
} from "@modules/init"

/**
 * Parked local-file init module (legacy v1).
 *
 * Reuses the Scope/Seeders/Synchronizers sub-modules now owned by `@modules/init`
 * and runs {@link LegacyInitService}. Kept un-registered by default; wire it in
 * place of the canonical `InitModule` for local-file dev seeding.
 */
@Module({
})
export class LegacyInitModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)

        return {
            ...dynamicModule,
            imports: [
                ...(dynamicModule.imports ?? []),
                ScopeModule.register({
                    isGlobal: true,
                }),
                SeedersModule.register({
                    isGlobal: true,
                }),
                SynchronizersModule.register({
                    isGlobal: true,
                }),
            ],
            providers: [
                ...(dynamicModule.providers ?? []),
                LegacyInitService,
            ],
            exports: [
                LegacyInitService,
            ],
        }
    }
}
