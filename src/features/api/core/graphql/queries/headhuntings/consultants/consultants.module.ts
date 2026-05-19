import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./consultants.module-definition"
import {
    ConsultantsHandler,
} from "./consultants.handler"
import {
    ConsultantsResolver,
} from "./consultants.resolver"
import {
    ConsultantsService,
} from "./consultants.service"

@Module({
    providers: [
        ConsultantsService,
        ConsultantsResolver,
        ConsultantsHandler,
    ],
})
export class ConsultantsQueryModule extends ConfigurableModuleClass {}
