
import {
    Module 
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./cli.module-definition"
import {
    UtilsModule 
} from "./utils" 

@Module({
    imports: [
        UtilsModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * CLI feature root. Only pulls `UtilsModule` globally — must not import
 * `InitModule` / `SeedersService` or the CLI would boot the git-sourced seeder
 * graph.
 */
export class CliModule extends ConfigurableModuleClass {}
