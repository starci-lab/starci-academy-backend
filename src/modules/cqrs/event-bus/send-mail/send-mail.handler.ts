import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    EnqueueSendMailJobService,
    EventBus,
} from "@modules/bussiness"
import {
    SendMailEvent,
    buildSendMailEventName,
} from "./send-mail.event"

/**
 * Event-bus handler that enqueues a `send-mail` BullMQ job for every
 * {@link SendMailEvent} published to it.
 *
 * Runtime flow:
 *   caller -> publish(event) -> EventBus (in-memory retry)
 *          -> EnqueueSendMailJobService.enqueue -> BullMQ queue
 *          -> SendMailWorker -> MailcowService (SMTP)
 */
@Injectable()
export class SendMailEventHandler {
    private readonly logger = new Logger(SendMailEventHandler.name)

    constructor(
        private readonly eventBus: EventBus,
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {}

    /**
     * Fire-and-forget publish. Returns as soon as the event bus has
     * accepted the task; enqueueing into BullMQ happens asynchronously
     * with retry so a transient failure does not lose the mail.
     */
    async publish(event: SendMailEvent): Promise<void> {
        await this.eventBus.execute({
            name: buildSendMailEventName(event),
            execute: async () => {
                const job = await this.enqueueSendMailJobService.enqueue(event)
                this.logger.log(
                    `Queued send-mail job=${job.id} subject="${event.subject}" to=${event.to.map((r) => r.address).join(",")}`,
                )
            },
        })
    }
}
