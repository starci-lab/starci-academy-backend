import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./consultant.module-definition"
import {
    ConsultantHandler,
} from "./consultant.handler"
import {
    ConsultantResolver,
} from "./consultant.resolver"
import {
    ConsultantService,
} from "./consultant.service"

@Module({
    providers: [
        ConsultantService,
        ConsultantResolver,
        ConsultantHandler,
    ],
})
export class ConsultantSingleQueryModule extends ConfigurableModuleClass {}
