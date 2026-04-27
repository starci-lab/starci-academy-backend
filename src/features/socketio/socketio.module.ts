import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./socketio.module-definition"
import {
    CoreModule,
} from "./core"
/**
 * Module for the Socket.IO.
 */
@Module({
    imports: [
        CoreModule.register({
            isGlobal: true,
        }),
    ],
})
export class SocketIoModule extends ConfigurableModuleClass {}
