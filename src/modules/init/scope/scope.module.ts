import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./scope.module-definition"
import {
    SeedScopeService,
} from "./seed-scope.service"
import {
    SyncScopeService,
} from "./sync-scope.service"

/**
 * Scope module — resolves the init seed/sync scope from `seed.yaml`.
 *
 * Exports {@link SeedScopeService} and {@link SyncScopeService} so seeders,
 * synchronizers, and the init orchestrator can inject them. Reads config via
 * the (global) `MountFilesystemService`.
 */
@Module({
})
export class ScopeModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)

        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                SeedScopeService,
                SyncScopeService,
            ],
            exports: [
                SeedScopeService,
                SyncScopeService,
            ],
        }
    }
}
