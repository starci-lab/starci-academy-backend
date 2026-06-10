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
    FoundationCategorySuggestionsSingleQueryModule,
} from "./foundation-category-suggestions"
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
        FoundationCategorySuggestionsSingleQueryModule.register({
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
