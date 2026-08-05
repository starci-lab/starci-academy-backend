import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./autocomplete.module-definition"
import {
    AutocompleteGlobalSearchSingleQueryModule,
} from "./global-search/global-search.module"
import {
    IndexSearchSingleQueryModule,
} from "./index-search/index-search.module"
import {
    ResolveRouteSingleQueryModule,
} from "./resolve-route/resolve-route.module"

@Module({
    imports: [
        AutocompleteGlobalSearchSingleQueryModule.register({
            isGlobal: true,
        }),
        IndexSearchSingleQueryModule.register({
            isGlobal: true,
        }),
        ResolveRouteSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Autocomplete query group -- global typeahead, single-index fuzzy search, and
 * route resolution -- so the GraphQL app can mount search without importing each leaf.
 */
export class AutocompleteQueriesModule extends ConfigurableModuleClass {
}

