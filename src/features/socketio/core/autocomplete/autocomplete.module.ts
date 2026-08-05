import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./autocomplete.module-definition"
import {
    AutocompleteGateway,
} from "./autocomplete.gateway"
import {
    GlobalSearchModule,
} from "./global-search/global-search.module"

@Module({
    imports: [
        GlobalSearchModule.register({
            isGlobal: true,
        }),
    ],
    providers: [
        AutocompleteGateway,
    ],
})
/**
 * Module providing Socket.IO autocomplete using CQRS + Elasticsearch.
 */
export class AutocompleteModule extends ConfigurableModuleClass {}
