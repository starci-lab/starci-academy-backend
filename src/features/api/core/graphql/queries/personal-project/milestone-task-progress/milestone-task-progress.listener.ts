import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    EventEmitterService,
    EventName,
    type MilestoneTaskProgressUpdatedEventPayload,
} from "@modules/event"
import {
    PersonalProjectProgressService,
} from "@modules/bussiness"

/**
 * Listens for MilestoneTaskProgressUpdated events (via NATS + local)
 * and recomputes + caches the progress immediately so it's warm for the next query.
 */
@Injectable()
export class MilestoneTaskProgressListener implements OnModuleInit {
    constructor(
        private readonly eventEmitterService: EventEmitterService,
        private readonly personalProjectProgressService: PersonalProjectProgressService,
    ) {}

    onModuleInit(): void {
        this.eventEmitterService.on({
            event: EventName.MilestoneTaskProgressUpdated,
            listener: async (payload: MilestoneTaskProgressUpdatedEventPayload) => {
                await this.personalProjectProgressService.updateProgress(payload)
            },
        })
    }
}
