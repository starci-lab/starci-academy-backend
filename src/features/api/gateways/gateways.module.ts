import {
    Module 
} from "@nestjs/common"
import {
    CallbackGateway 
} from "./callback.gateway"
import {
    SocketIoModule 
} from "@modules/socketio"

@Module({
    imports: [
        SocketIoModule,
    ],
    providers: [
        CallbackGateway,
    ],
    exports: [
        CallbackGateway,
    ],
})
export class GatewaysModule {}
