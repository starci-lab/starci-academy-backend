import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketServer,
} from "@nestjs/websockets"
import {
    JobNotificationsWebSocketGateway,
} from "@modules/platform/socketio/decorators/gateway"
import {
    WsResponseService,
} from "@modules/platform/socketio/response.service"
import type {
    TypedSocket,
} from "@modules/platform/socketio/types/socket"
import {
    PublicationEvent,
} from "../../enums/publication-event"
import {
    SubscriptionEvent,
} from "../../enums/subscription-event"
import {
    SubcribeJobNotificationService,
} from "./handle-subcribe/subcribe.service"
import type {
    SubcribeJobNotificationSocketIoPayload,
} from "./handle-subcribe/types/payload"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import type {
    JobStatusUpdatedEventPayload,
} from "@modules/platform/event/types/event-payload/job-status-updated"
import {
    JobRoomService,
} from "@modules/integrations/bullmq/rooms/job.service"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    OnModuleInit
} from "@nestjs/common"
import type {
    Namespace,
} from "socket.io"
import {
    JobStatusUpdatedSocketIoMessage,
} from "../types/job-status-message"
import {
    JobStatusReadService,
} from "@modules/bussiness/jobs/atomic/job-status-read.service"

@JobNotificationsWebSocketGateway()
/**
 * WebSocket gateway for job notification subscription in the `/job_notifications` namespace.
 */
export class SubcribeJobNotificationGateway implements OnModuleInit {
    /**
     * The service to handle job notification subscription.
     */
    constructor(
        private readonly subcribeJobNotificationService: SubcribeJobNotificationService,
        private readonly wsResponseService: WsResponseService,
        private readonly jobRoomService: JobRoomService,
        private readonly eventEmitterService: EventEmitterService,
        private readonly jobStatusReadService: JobStatusReadService,
    ) {}

    /**
     * The server instance.
     */
    @WebSocketServer()
    private readonly server: Namespace

    /**
     * Handle job notification subscription.
     */
    @SubscribeMessage(PublicationEvent.SubscribeJobNotification)
    async handleSubcribeJobNotification(
        @ConnectedSocket() client: TypedSocket,
        @MessageBody() payload: SubcribeJobNotificationSocketIoPayload,
    ) {
        await this.subcribeJobNotificationService.execute({
            payload,
            client,
        })
    }

    /**
     * On module init.
     */
    onModuleInit(): void {
        this.eventEmitterService.on({
            event: EventName.JobStatusUpdated,
            listener: async (payload: JobStatusUpdatedEventPayload) => {
                const status = await this.jobStatusReadService.getForPublication(payload.jobId)
                if (!status) {
                    return
                }
                // A worker can emit from inside the transaction that persists the
                // terminal state. The publication listener then races that commit
                // and may read the previous `processing` row. Preserve all safe
                // fields from the shared read model, but let the event's own
                // transaction-authoritative status win for this notification.
                const publication = {
                    ...status,
                    status: payload.status,
                }
                this.wsResponseService.successToRoom<JobStatusUpdatedSocketIoMessage>(
                    {
                        message: "Job status updated",
                        data: publication,
                        room: this.jobRoomService.name(payload.jobId),
                        namespace: this.server,
                        eventName: SubscriptionEvent.JobStatusUpdated,
                    },
                )
            },
        })
    }
}

