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
import {
    BloomFiltersModule,
} from "./bloom-filters"
import {
    UserModule,
} from "./user"
import {
    ProgressModule,
} from "./progress"
import {
    FlashcardModule,
} from "./flashcard"
import {
    CodingModule,
} from "./coding"
import {
    CreditModule,
} from "./credit"
import {
    DiscussionModule,
} from "./discussion"
import {
    AiLabModule,
} from "./ai-lab"

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
            // import the bloom filters module
            BloomFiltersModule.register(options),
            // import the user module
            UserModule.register(options),
            // import the progress module
            ProgressModule.register(options),
            // import the flashcard (interview-prep) module
            FlashcardModule.register(options),
            // import the coding-practice module
            CodingModule.register(options),
            // import the AI credit usage module
            CreditModule.register(options),
            // import the content discussion (comments + reactions) module
            DiscussionModule.register(options),
            // import the AI Lab (playground + eval grading) module
            AiLabModule.register(options),
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