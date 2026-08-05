import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./foundations.module-definition"
import {
    FoundationsHandler,
} from "./foundations.handler"
import {
    FoundationsResolver,
} from "./foundations.resolver"
import {
    FoundationsService,
} from "./foundations.service"

@Module({
    providers: [
        FoundationsService,
        FoundationsResolver,
        FoundationsHandler,
    ],
})
/** Feature-module boundary for the `foundations` list-within-category query. */
export class FoundationsSingleQueryModule extends ConfigurableModuleClass {}
