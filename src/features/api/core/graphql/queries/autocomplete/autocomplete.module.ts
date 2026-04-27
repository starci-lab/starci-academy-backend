import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./autocomplete.module-definition"
import {
    AutocompleteGlobalSearchQueryModule,
} from "./global-search"

@Module({
    imports: [
        AutocompleteGlobalSearchQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class AutocompleteQueriesModule extends ConfigurableModuleClass {
}

