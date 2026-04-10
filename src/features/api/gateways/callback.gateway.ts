import {
    CallbackWebSocketGateway,
    TypedSocket,
    WsSuccessMessage,
    WsTransformInterceptor
} from "@modules/socketio"
import {
    Injectable,
    UseInterceptors
} from "@nestjs/common"
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketServer,
} from "@nestjs/websockets"
import {
    Namespace
} from "socket.io"

export enum testEvent {
    HelloWorldFromBE = "subcribe.hello.world.from.be"
}

export interface SubscribeHelloWorldEventPayload {
    message: string
}


@Injectable()
@CallbackWebSocketGateway()
export class CallbackGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Namespace
    
    afterInit() {
        console.log("Gateway initialized", this.server)
    }

    handleConnection(client: TypedSocket) {
        console.log("Client connected", client.id)
    }

    handleDisconnect(client: TypedSocket) {
        console.log("Client disconnected", client.id)
    }


    @WsSuccessMessage("Subcribe to HelloWorld succesfully")
    @UseInterceptors(WsTransformInterceptor)
    @SubscribeMessage(testEvent.HelloWorldFromBE)
    async sendMessage(
        @ConnectedSocket() client: any,
        @MessageBody() data: SubscribeHelloWorldEventPayload
    ) {
        console.log(`Sending message: ${data.message}`)
        this.server.emit(testEvent.HelloWorldFromBE, data.message)
    }
}
