import {
    Module,
} from "@nestjs/common"
import {
    CoursesMutationsModule,
} from "./courses"
import {
    ConfigurableModuleClass,
} from "./mutations.module-definition"

/**
 * GraphQL mutations (courses, etc.).
 */
@Module({
    imports: [
        CoursesMutationsModule.register({
            isGlobal: true,
        }),
    ],
})
export class MutationsModule extends ConfigurableModuleClass {}
