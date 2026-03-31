import {
    DynamicModule, 
    Module,
    Provider,
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./utils.module-definition"
import {
    CourseTransformerService 
} from "./course-transformer.service"
import {
    OPTIONS_TYPE,
} from "./utils.module-definition"

/**
 * Module for the GraphQL.
 */
@Module({
})
export class UtilsModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const providers: Array<Provider> = [
            CourseTransformerService,
        ]
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                ...providers,
            ],
            exports: [
                ...(dynamicModule.exports ?? []),
                ...providers,
            ],
        }
    }
}
