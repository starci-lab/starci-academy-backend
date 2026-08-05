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
/** Feature-module boundary for the `consultants` query — wires its resolver + service + CQRS handler. */
export class ConsultantsSingleQueryModule extends ConfigurableModuleClass {}
