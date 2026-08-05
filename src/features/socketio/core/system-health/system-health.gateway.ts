import {
    OnModuleInit,
} from "@nestjs/common"
import {
    WebSocketServer,
} from "@nestjs/websockets"
import type {
    Namespace,
} from "socket.io"
import {
    SystemHealthWebSocketGateway,
} from "@modules/platform/socketio/decorators/gateway"
import {
    WsResponseService,
} from "@modules/platform/socketio/response.service"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import type {
    AiModelHealthUpdatedEventPayload,
} from "@modules/platform/event/types/event-payload/ai-model-health-updated"
import {
    SubscriptionEvent,
} from "../enums/subscription-event"
import type {
    AiModelHealthSocketIoMessage,
} from "./types/message"

@SystemHealthWebSocketGateway()
/**
 * WebSocket gateway for the `/system_health` namespace -- PUBLIC, no auth.
 *
 * Every connected client (no room/subscribe step needed) receives the latest
 * per-model AI latency snapshot whenever a probe cycle completes. The probe
 * scheduler ({@link AiModelLatencyService}) fans out a local
 * {@link EventName.AiModelHealthUpdated} event; this gateway broadcasts it to
 * the whole namespace as {@link SubscriptionEvent.AiModelHealth}. Safe to render
 * on a public status page -- the payload carries no raw keys, only model name,
 * provider, category, up/down, latency and freshness.
 */
export class SystemHealthGateway implements OnModuleInit {
    constructor(
        private readonly wsResponseService: WsResponseService,
        private readonly eventEmitterService: EventEmitterService,
    ) {}

    /** The namespace server instance used to broadcast to all clients. */
    @WebSocketServer()
    private readonly server: Namespace

    /**
     * Wire the local event listener that broadcasts each fresh model-latency
     * snapshot to every connected client.
     */
    onModuleInit(): void {
        // a probe cycle finished -> push the full snapshot to all status-page clients
        this.eventEmitterService.on({
            event: EventName.AiModelHealthUpdated,
            listener: (payload: AiModelHealthUpdatedEventPayload) => {
                this.wsResponseService.broadcast<AiModelHealthSocketIoMessage>({
                    message: "AI model health updated",
                    data: {
                        models: payload.models,
                    },
                    namespace: this.server,
                    eventName: SubscriptionEvent.AiModelHealth,
                })
            },
        })
    }
}
