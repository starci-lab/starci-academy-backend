import {
    Module,
    DynamicModule,
    Type,
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./bussiness.module-definition"
import {
    JobsModule 
} from "./jobs"
import {
    OPTIONS_TYPE,
} from "./bussiness.module-definition"
import {
    TransactionsModule,
} from "./transactions"

/**
 * The module for the bussiness logics.
 */
@Module({
})
export class BussinessModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const modules: Array<DynamicModule | Type<unknown>> = [
            // import the jobs module
            JobsModule.register(options),
            // import the transactions module
            TransactionsModule.register(options),
        ]
        return {
            ...dynamicModule,
            imports: [
                ...modules,
            ],
            providers: [
                ...(dynamicModule.providers ?? []),
            ],
            exports: [
                ...modules,
            ],
        }
    }
}