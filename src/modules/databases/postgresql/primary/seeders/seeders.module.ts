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
    CourseLoaderService,
    CoursesService,
} from "./courses"
/**
 * The module for the Seeders.
 */
@Module({
    providers: [
        CourseLoaderService,
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