import {
    Module 
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./socketio.module-definition"
import {
    WsResponseService 
} from "./response.service"

@Module({
    providers: [
        WsResponseService,
    ],
    exports: [WsResponseService],
})
/**
 * Exports WsResponseService so gateways share one success/error emit shape across
 * namespaces.
 */
export class SocketIoModule extends ConfigurableModuleClass {}
