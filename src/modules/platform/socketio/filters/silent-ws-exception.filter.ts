import {
    ArgumentsHost, Catch, WsExceptionFilter 
} from "@nestjs/common"
import {
    WsException 
} from "@nestjs/websockets"

@Catch(WsException)
/** Turns a thrown WsException into an `error` emit instead of disconnecting the socket. */
export class SilentWsExceptionFilter implements WsExceptionFilter {
    catch(exception: WsException, host: ArgumentsHost) {
        const client = host.switchToWs().getClient()
        client.emit(
            "error",
            exception.getError()
        )
    }
}