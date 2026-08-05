import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./socketio.module-definition"
import {
    CoreModule,
} from "./core/core.module"
@Module({
    imports: [
        CoreModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Module for the Socket.IO.
 */
export class SocketIoModule extends ConfigurableModuleClass {}
