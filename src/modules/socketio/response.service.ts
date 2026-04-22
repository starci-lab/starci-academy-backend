import {
    Injectable
} from "@nestjs/common"
import {
    SuperJSON
} from "superjson"
import {
    InjectSuperJson
} from "@modules/mixin"
import {
    TypedSocket 
} from "./types"

/** Params for sending a success WS message. */
export interface SuccessParams<T = unknown> {
    message: string
    data?: T
    client: TypedSocket
    eventName: string
}

/** Params for sending a error WS message. */
export interface ErrorParams {
    error: Error
    client: TypedSocket
    eventName: string
}

@Injectable()
export class WsResponseService {
    constructor(
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
    ) {}

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