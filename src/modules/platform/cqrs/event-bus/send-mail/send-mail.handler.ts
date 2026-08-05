import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness"
import {
    EventsHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "../../icqrs-handler"
import {
    SendMailEvent,
} from "./send-mail.event"

@Injectable()
@EventsHandler(SendMailEvent)
/**
 * Event-bus handler that enqueues a `send-mail` BullMQ job for every
 * {@link SendMailEvent} published to it.
 *
 * Runtime flow:
 *   caller -> publish(event) -> EventBus (in-memory retry)
 *          -> EnqueueSendMailJobService.enqueue -> BullMQ queue
 *          -> SendMailWorker -> Nest Mailer (nodemailer + Brevo SMTP)
 */
export class SendMailEventHandler
    extends ICQRSHandler<SendMailEvent, void>
    implements ICommandHandler<SendMailEvent, void> {
    private readonly logger = new Logger(SendMailEventHandler.name)

    constructor(
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
    ) {
        super()
    }

    protected override async process(event: SendMailEvent): Promise<void> {
        await this.enqueueSendMailJobService.enqueue(event.payload)
        this.logger.log(
            `Queued send-mail event for ${event.payload.to.map((r) => r.address).join(", ")}`,
        )
    }
}
