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
/** Feature-module boundary for the `consultant` query — wires its resolver + service + CQRS handler. */
export class ConsultantSingleQueryModule extends ConfigurableModuleClass {}
