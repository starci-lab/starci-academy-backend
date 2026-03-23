import {
    Module 
} from "@nestjs/common"
import {
    SeedersService 
} from "./seeders.service"
import {
    ConfigurableModuleClass 
} from "./seeders.module-definition"
/**
 * The module for the Seeders.
 */
@Module({
    providers: [
        SeedersService
    ],
    exports: [
        SeedersService
    ]
})
export class SeedersModule extends ConfigurableModuleClass {
}