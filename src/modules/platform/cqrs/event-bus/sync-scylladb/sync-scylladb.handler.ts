import {
    Injectable,
} from "@nestjs/common"
import {
    EventsHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "../../icqrs-handler"
import {
    SyncScyllaDBEvent,
} from "./sync-scylladb.event"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    EnqueueSyncScyllaDBJobService,
} from "@modules/bussiness/jobs/enqueue/sync-scylladb.service"

@Injectable()
@EventsHandler(SyncScyllaDBEvent)
/**
 * Event handler for one-off ScyllaDB sync after a successful write flow.
 */
export class SyncScyllaDBEventHandler
    extends ICQRSHandler<SyncScyllaDBEvent, void>
    implements ICommandHandler<SyncScyllaDBEvent, void> {

    constructor(
        private readonly enqueueSyncScyllaDBJobService: EnqueueSyncScyllaDBJobService,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    protected override async process(event: SyncScyllaDBEvent): Promise<void> {
        const { entityType, id } = event.payload
        await this.enqueueSyncScyllaDBJobService.enqueue(
            {
                entityType,
                id,
            },
        )
        this.winstonService.log(WinstonLog.AsyncEventQueued,
            {
                op: "async.sync-scylladb.queued",
                meta: {
                    entityType,
                    id,
                },
            })
    }
}
