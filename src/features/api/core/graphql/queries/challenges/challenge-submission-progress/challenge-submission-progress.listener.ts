import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    EventEmitterService,
    EventName,
    type ChallengeSubmissionProgressUpdatedEventPayload,
} from "@modules/event"
import {
    ChallengeProgressService,
} from "@modules/bussiness"

/**
 * Listens for ChallengeSubmissionProgressUpdated events (via NATS + local)
 * and recomputes + caches the progress immediately so it's warm for the next query.
 */
@Injectable()
export class ChallengeSubmissionProgressListener implements OnModuleInit {
    constructor(
        private readonly eventEmitterService: EventEmitterService,
        private readonly challengeProgressService: ChallengeProgressService,
    ) {}

    onModuleInit(): void {
        this.eventEmitterService.on({
            event: EventName.ChallengeSubmissionProgressUpdated,
            listener: async (payload: ChallengeSubmissionProgressUpdatedEventPayload) => {
                await this.challengeProgressService.updateProgress(payload)
            },
        })
    }
}
