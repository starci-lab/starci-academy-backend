import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness"

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
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {}
}
