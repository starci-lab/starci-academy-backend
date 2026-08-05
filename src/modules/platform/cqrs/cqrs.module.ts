import {
    Module
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "./cqrs.module-definition"
import {
    EventBusModule,
} from "./event-bus/event-bus.module"

@Module({
    imports: [
        EventBusModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Module that exposes the CQRS pattern via the NestJS Event Bus.
 */
export class CQRSModule extends ConfigurableModuleClass {}
