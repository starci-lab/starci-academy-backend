import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common"
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketServer,
} from "@nestjs/websockets"
import {
    Namespace,
} from "socket.io"
import {
    JobPipelineWebSocketGateway,
    SocketIoEvent,
    TypedSocket,
} from "@modules/socketio"
import {
    JobNotificationPayload,
    JobNotificationStatus,
    JobSubscribeRequest,
} from "../dtos"
import {
    JobNotifierService,
} from "../services"

const userRoom = (userId: string) => `user:${userId}`
const jobRoom = (jobId: string) => `job:${jobId}`

/**
 * WebSocket gateway that streams BullMQ job pipeline updates
 * (processing / completed / failed) to the owner of the job.
 *
 * Client usage:
 *   socket = io("<host>/jobs", { auth: { token } })
 *   // the server joins `user:<userId>` on connection
 *   socket.emit("job.subscribe", { jobId })         // optional: scope to one job
 *   socket.on("job.processing", (p) => ...)
 *   socket.on("job.completed",  (p) => ...)
 *   socket.on("job.failed",     (p) => ...)
 */
@Injectable()
@JobPipelineWebSocketGateway()
export class JobPipelineGateway
implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(JobPipelineGateway.name)
    private unsubscribe?: () => void

    @WebSocketServer()
        server: Namespace

    constructor(
        private readonly jobNotifier: JobNotifierService,
    ) {}

    onModuleInit(): void {
        this.unsubscribe = this.jobNotifier.onNotification(
            (payload) => this.dispatch(payload),
        )
    }

    onModuleDestroy(): void {
        this.unsubscribe?.()
    }

    handleConnection(client: TypedSocket): void {
        const userId = client.data?.userId
        if (userId) {
            client.join(userRoom(userId))
            this.logger.debug(`client ${client.id} joined ${userRoom(userId)}`)
        }
    }

    handleDisconnect(client: TypedSocket): void {
        this.logger.debug(`client ${client.id} disconnected`)
    }

    @SubscribeMessage(SocketIoEvent.JobSubscribe)
    handleSubscribe(
        @ConnectedSocket() client: TypedSocket,
        @MessageBody() body: JobSubscribeRequest,
    ): { ok: true } {
        if (body?.jobId) {
            client.join(jobRoom(body.jobId))
        }
        return {
            ok: true,
        }
    }

    @SubscribeMessage(SocketIoEvent.JobUnsubscribe)
    handleUnsubscribe(
        @ConnectedSocket() client: TypedSocket,
        @MessageBody() body: JobSubscribeRequest,
    ): { ok: true } {
        if (body?.jobId) {
            client.leave(jobRoom(body.jobId))
        }
        return {
            ok: true,
        }
    }

    /**
     * Route an internal notification to the right rooms / event name.
     */
    private dispatch(payload: JobNotificationPayload): void {
        const event = this.eventName(payload.status)
        const rooms: Array<string> = [jobRoom(payload.jobId)]
        if (payload.userId) {
            rooms.push(userRoom(payload.userId))
        }
        this.server.to(rooms).emit(event, payload)
    }

    private eventName(status: JobNotificationStatus): SocketIoEvent {
        switch (status) {
        case JobNotificationStatus.Processing:
            return SocketIoEvent.JobProcessing
        case JobNotificationStatus.Completed:
            return SocketIoEvent.JobCompleted
        case JobNotificationStatus.Failed:
            return SocketIoEvent.JobFailed
        }
    }
}
