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
import {
    ResolveRouteSingleQueryModule,
} from "./resolve-route"

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
export class AutocompleteQueriesModule extends ConfigurableModuleClass {
}

