import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./foundation-categories.module-definition"
import {
    FoundationCategoriesHandler,
} from "./foundation-categories.handler"
import {
    FoundationCategoriesResolver,
} from "./foundation-categories.resolver"
import {
    FoundationCategoriesService,
} from "./foundation-categories.service"

@Module({
    providers: [
        FoundationCategoriesService,
        FoundationCategoriesResolver,
        FoundationCategoriesHandler,
    ],
})
/** Feature-module boundary for the `foundationCategories` list query. */
export class FoundationCategoriesSingleQueryModule extends ConfigurableModuleClass {}
