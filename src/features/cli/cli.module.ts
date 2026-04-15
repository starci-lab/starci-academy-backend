
import {
    Module 
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./cli.module-definition"
import {
    UtilsModule 
} from "./utils" 

/**
 * CLI module for the application.
 */
@Module({
    imports: [
        UtilsModule.register({
            isGlobal: true,
        }),
    ],
})
export class CliModule extends ConfigurableModuleClass {}
