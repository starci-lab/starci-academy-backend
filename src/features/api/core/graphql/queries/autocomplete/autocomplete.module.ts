import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./autocomplete.module-definition"
import {
    AutocompleteGlobalSearchSingleQueryModule,
} from "./global-search"
import {
    IndexSearchSingleQueryModule,
} from "./index-search"

@Module({
    imports: [
        AutocompleteGlobalSearchSingleQueryModule.register({
            isGlobal: true,
        }),
        IndexSearchSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class AutocompleteQueriesModule extends ConfigurableModuleClass {
}

