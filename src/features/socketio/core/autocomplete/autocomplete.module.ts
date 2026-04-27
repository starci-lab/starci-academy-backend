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
} from "./global-search"

/**
 * Module providing Socket.IO autocomplete using CQRS + Elasticsearch.
 */
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
export class AutocompleteModule extends ConfigurableModuleClass {}
