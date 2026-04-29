import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./autocomplete.module-definition"
import {
    AutocompleteGlobalSearchQueryModule,
} from "./global-search"
import {
    IndexSearchQueryModule,
} from "./index-search"

@Module({
    imports: [
        AutocompleteGlobalSearchQueryModule.register({
            isGlobal: true,
        }),
        IndexSearchQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class AutocompleteQueriesModule extends ConfigurableModuleClass {
}

