import {
    Module 
} from "@nestjs/common"
import {
    SeedersService 
} from "./seeders.service"
import {
    ConfigurableModuleClass 
} from "./seeders.module-definition"
import {
    CoursesService,
} from "./courses"
/**
 * The module for the Seeders.
 */
@Module({
    providers: [
        SeedersService,
        CoursesService,
    ],
    exports: [
        SeedersService,
        CoursesService,
    ]
})
export class SeedersModule extends ConfigurableModuleClass {
}