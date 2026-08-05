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
} from "./data-git"
import {
    SeedDiffOverlayService,
} from "./diff"
import {
    InitConfigParserService,
} from "./config"
import {
    ScopeModule,
} from "./scope"
import {
    SeedersModule,
} from "./seeders"
import {
    SynchronizersModule,
} from "./synchronizers"

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
