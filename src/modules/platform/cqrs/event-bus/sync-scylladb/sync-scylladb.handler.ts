import {
    Injectable,
    Logger,
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
    EnqueueSyncScyllaDBJobService,
} from "@modules/bussiness"

@Injectable()
@EventsHandler(SyncScyllaDBEvent)
/**
 * Event handler for one-off ScyllaDB sync after a successful write flow.
 */
export class SyncScyllaDBEventHandler
    extends ICQRSHandler<SyncScyllaDBEvent, void>
    implements ICommandHandler<SyncScyllaDBEvent, void> {
    private readonly logger = new Logger(SyncScyllaDBEventHandler.name)

    constructor(
        private readonly enqueueSyncScyllaDBJobService: EnqueueSyncScyllaDBJobService,
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
        this.logger.log(`Queued sync-scylladb for ${entityType}(${id}) via CQRS event`)
    }
}
