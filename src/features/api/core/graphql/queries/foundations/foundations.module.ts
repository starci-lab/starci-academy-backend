import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./foundations.module-definition"
import {
    FoundationCategoriesSingleQueryModule,
} from "./foundation-categories"
import {
    FoundationsSingleQueryModule,
} from "./foundations/foundations.module"
import {
    FoundationSingleQueryModule,
} from "./foundation"

@Module({
    imports: [
        FoundationCategoriesSingleQueryModule.register({
            isGlobal: true,
        }),
        FoundationsSingleQueryModule.register({
            isGlobal: true,
        }),
        FoundationSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class FoundationsModule extends ConfigurableModuleClass {}
