import {
    Injectable,
} from "@nestjs/common"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    EventsHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
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

    constructor(
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    protected override async process(event: SendMailEvent): Promise<void> {
        await this.enqueueSendMailJobService.enqueue(event.payload)
        this.winstonService.log(WinstonLog.AsyncEventQueued,
            {
                op: "async.send-mail.queued",
                meta: {
                    recipients: event.payload.to.map((r) => r.address),
                },
            })
    }
}
