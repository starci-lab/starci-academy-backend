import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./init-v2.module-definition"
import {
    InitV2Service,
} from "./init-v2.service"
import {
    DataGitBootstrapService,
} from "./data-git"
import {
    SeedDiffOverlayService,
} from "./diff"
import {
    ScopeModule,
} from "@modules/init/scope"
import {
    SeedersModule,
} from "@modules/init/seeders"
import {
    SynchronizersModule,
} from "@modules/init/synchronizers"

/**
 * Init V2 module — git-sourced initialization orchestrator.
 *
 * Mirrors {@link InitModule} (imports the same Scope/Seeders/Synchronizers
 * sub-modules) but runs {@link InitV2Service}, which first materializes the
 * data root from the private `data` GitHub repo before seeding. Wired in place
 * of `InitModule` when `INIT_V2_ENABLED` is set.
 */
@Module({
})
export class InitV2Module extends ConfigurableModuleClass {
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
                DataGitBootstrapService,
                SeedDiffOverlayService,
                InitV2Service,
            ],
            exports: [
                InitV2Service,
            ],
        }
    }
}
