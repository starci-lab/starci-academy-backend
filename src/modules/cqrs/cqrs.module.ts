import {
    Module
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "./cqrs.module-definition"
import {
    EventBusModule 
} from "./event-bus"

/**
 * Module that exposes the CQRS pattern via the NestJS Event Bus.
 */
@Module({
    imports: [
        EventBusModule.register({
            isGlobal: true,
        }),
    ],
})
export class CQRSModule extends ConfigurableModuleClass {}
