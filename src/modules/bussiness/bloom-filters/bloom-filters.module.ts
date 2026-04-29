import {
    Module,
    DynamicModule,
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./bloom-filters.module-definition"
import {
    OPTIONS_TYPE,
} from "./bloom-filters.module-definition"
import {
    EmailBloomFilterService,
} from "./email.service"

/**
 * The module for the bussiness logics.
 */
@Module({
})
export class BloomFiltersModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const modules: Array<DynamicModule> = [
        ]
        return {
            ...dynamicModule,
            imports: [
                ...modules,
            ],
            providers: [
                ...(dynamicModule.providers ?? []),
                EmailBloomFilterService,
            ],
            exports: [
                ...modules,
                EmailBloomFilterService,
            ],
        }
    }
}