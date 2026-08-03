import {
    Injectable
} from "@nestjs/common"
import {
    SuperJSON
} from "superjson"
import {
    InjectSuperJson
} from "@modules/mixin"
import type {
    SuccessParams,
    SuccessToRoomParams,
    BroadcastParams,
    ErrorParams,
} from "./types"

@Injectable()
export class WsResponseService {
    constructor(
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {}

    successToRoom<T = unknown>(
        { 
            message, 
            data, 
            room, 
            namespace, 
            eventName 
        }: SuccessToRoomParams<T>,
    ): void {
        namespace.to(room).emit(
            eventName,
            {
                success: true,
                message,
                data,
            },
        )
    }

    /**
     * Broadcast a success WS message to EVERY client connected to a namespace
     * (no room scoping). For public fan-outs where every listener should get the
     * same payload — e.g. the per-model AI latency snapshot on the status page.
     * @param params - The parameters for the broadcast message.
     * @returns void.
     */
    broadcast<T = unknown>(
        {
            message,
            data,
            namespace,
            eventName,
        }: BroadcastParams<T>,
    ): void {
        // emit on the namespace itself → delivered to all of its sockets
        namespace.emit(
            eventName,
            {
                success: true,
                message,
                data,
            },
        )
    }

    /**
     * Send a success WS message.
     * @param params - The parameters for the success message.
     * @returns void.
     */
    success<T = unknown>(
        { 
            message, 
            data, 
            client, 
            eventName 
        }: SuccessParams<T>,
    ): void {
        client.emit(
            eventName,
            {
                success: true,
                message,
                data,
            },
        )
    }

    /**
     * Send a error WS message.
     * @param params - The parameters for the error message.
     * @returns void.
     */
    error(
        { 
            client, 
            error,
            eventName 
        }: ErrorParams,
    ): void {
        client.emit(
            eventName,
            {
                success: false,
                message: error?.message ?? "Unknown error",
                error: error?.name ?? "Unknown error",
            },
        )
    }
}