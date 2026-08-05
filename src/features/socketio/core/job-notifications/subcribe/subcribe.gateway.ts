import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
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
import {
    WebSocketServer 
} from "@nestjs/websockets"
import type {
    Namespace,
} from "socket.io"
import {
    JobStatusUpdatedSocketIoMessage,
} from "../types/job-status-message"

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
            listener: (payload: JobStatusUpdatedEventPayload) => {
                this.wsResponseService.successToRoom<JobStatusUpdatedSocketIoMessage>(
                    {
                        message: "Job status updated",
                        data: {
                            jobId: payload.jobId,
                            challengeSubmissionId: payload.challengeSubmissionId,
                            category: payload.category,
                            status: payload.status,
                            error: payload.error,
                        },
                        room: this.jobRoomService.name(payload.jobId),
                        namespace: this.server,
                        eventName: SubscriptionEvent.JobStatusUpdated,
                    },
                )
            },
        })
    }
}

