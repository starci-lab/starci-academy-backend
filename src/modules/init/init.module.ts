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
    DataGitBootstrapService,
} from "./data-git/data-git.service"
import {
    SeedDiffOverlayService,
} from "./diff/seed-config-overlay.service"
import {
    InitConfigParserService,
} from "./config/init-config-parser.service"
import {
    ScopeModule,
} from "./scope/scope.module"
import {
    SeedersModule,
} from "./seeders/seeders.module"
import {
    SynchronizersModule,
} from "./synchronizers/synchronizers.module"

@Module({
})
/**
 * Init module -- canonical git-sourced initialization orchestrator.
 *
 * Owns the Scope/Seeders/Synchronizers sub-modules and runs {@link InitService},
 * which materializes the data root from the private `data` GitHub repo (diff)
 * and seeds before pulling the source into `.contexts`. The local-file variant
 * lives in the parked `_init` module.
 */
export class InitModule extends ConfigurableModuleClass {
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
                InitConfigParserService,
                InitService,
            ],
            exports: [
                InitService,
            ],
        }
    }
}
