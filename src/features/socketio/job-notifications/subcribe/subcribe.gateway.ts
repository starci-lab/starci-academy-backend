import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
} from "@nestjs/websockets"
import {
    JobNotificationsWebSocketGateway,
    WsResponseService,
} from "@modules/socketio"
import type {
    TypedSocket,
} from "@modules/socketio"
import {
    PublicationEvent,
    SubscriptionEvent,
} from "../../enums"
import {
    SubcribeJobNotificationService,
} from "./handle-subcribe"
import type {
    SubcribeJobNotificationSocketIoPayload,
} from "./handle-subcribe"
import {
    EventName,
    type JobStatusUpdatedEventPayload 
} from "@modules/event"
import {
    JobRoomService 
} from "@modules/bullmq"
import {
    EventEmitterService 
} from "@modules/event"
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
    JobStatusUpdatedSocketIoMessage 
} from "../types"

/**
 * WebSocket gateway for job notification subscription in the `/job_notifications` namespace.
 */
@JobNotificationsWebSocketGateway()
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
    @SubscribeMessage(PublicationEvent.SubcribeJobNotification)
    async handleSubcribeJobNotification(
        @ConnectedSocket() client: TypedSocket,
        @MessageBody() payload: SubcribeJobNotificationSocketIoPayload,
    ) {
        const result = await this.subcribeJobNotificationService.execute({
            payload,
            client,
        })
        this.wsResponseService.success({
            message: "Job notification subscription registered successfully",
            data: result,
            client,
            eventName: PublicationEvent.SubcribeJobNotification,
        })
    }

    /**
     * On module init.
     */
    onModuleInit(): void {
        this.eventEmitterService.on({
            event: EventName.JobStatusUpdated,
            listener: (payload: JobStatusUpdatedEventPayload) => {
                /** Send the job status updated event to the room. */
                this.server.to(
                    this.jobRoomService.name(payload.jobId)
                ).emit(
                    SubscriptionEvent.JobStatusUpdated, 
                    this.wsResponseService.successToRoom<JobStatusUpdatedSocketIoMessage>(
                        {
                            message: "Job status updated",
                            data: {
                                jobId: payload.jobId,
                                status: payload.status,
                                error: payload.error,
                            },
                            room: this.jobRoomService.name(payload.jobId),
                            namespace: this.server,
                            eventName: SubscriptionEvent.JobStatusUpdated,
                        }
                    )
                )
            },
        })
    }
}

