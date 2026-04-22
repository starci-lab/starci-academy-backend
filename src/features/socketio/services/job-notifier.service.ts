import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    EventEmitter,
} from "events"
import {
    JobNotificationPayload,
    JobNotificationStatus,
} from "../dtos"

export const JOB_NOTIFICATION_EVENT = "job.notification"

export type JobNotifyInput = Omit<JobNotificationPayload, "status" | "timestamp">

/**
 * Bridges the BullMQ workers and the Socket.IO gateway.
 *
 * Workers call `notifyProcessing / notifyCompleted / notifyFailed`.
 * The gateway subscribes via `onNotification` and forwards the
 * payload to the clients that are in the matching room
 * (per-user room `user:<userId>` or per-job room `job:<jobId>`).
 *
 * In a multi-instance deployment the Redis Socket.IO adapter
 * broadcasts the emit across all gateway processes, so only the
 * instance on which the worker runs needs to call these methods.
 */
@Injectable()
export class JobNotifierService {
    private readonly logger = new Logger(JobNotifierService.name)
    private readonly emitter = new EventEmitter()

    notifyProcessing(input: JobNotifyInput): void {
        this.emit({
            ...input,
            status: JobNotificationStatus.Processing,
            timestamp: new Date().toISOString(),
        })
    }

    notifyCompleted(input: JobNotifyInput): void {
        this.emit({
            ...input,
            status: JobNotificationStatus.Completed,
            progress: 100,
            timestamp: new Date().toISOString(),
        })
    }

    notifyFailed(input: JobNotifyInput & { error: string }): void {
        this.emit({
            ...input,
            status: JobNotificationStatus.Failed,
            timestamp: new Date().toISOString(),
        })
    }

    onNotification(
        handler: (payload: JobNotificationPayload) => void,
    ): () => void {
        this.emitter.on(JOB_NOTIFICATION_EVENT, handler)
        return () => this.emitter.off(JOB_NOTIFICATION_EVENT, handler)
    }

    private emit(payload: JobNotificationPayload): void {
        this.logger.debug(
            `job notification: ${payload.status} job=${payload.jobId} queue=${payload.queueName}`,
        )
        this.emitter.emit(JOB_NOTIFICATION_EVENT, payload)
    }
}
