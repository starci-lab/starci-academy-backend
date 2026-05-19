import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./foundation.module-definition"
import {
    FoundationHandler,
} from "./foundation.handler"
import {
    FoundationResolver,
} from "./foundation.resolver"
import {
    FoundationService,
} from "./foundation.service"

@Module({
    providers: [
        FoundationService,
        FoundationResolver,
        FoundationHandler,
    ],
})
export class FoundationSingleQueryModule extends ConfigurableModuleClass {}
