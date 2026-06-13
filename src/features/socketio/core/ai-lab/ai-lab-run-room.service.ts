import {
    Injectable,
} from "@nestjs/common"

/** Builds the Socket.IO room name for a single AI Lab run's token stream. */
@Injectable()
export class AiLabRunRoomService {
    /**
     * Room name for one playground run. The learner subscribes to this room and
     * receives that run's token-chunk events.
     * @param runId - The run primary id.
     * @returns The deterministic room name, e.g. `ai-lab-run:abc-123`.
     */
    name(runId: string): string {
        // namespace the id so it never collides with other room conventions
        return `ai-lab-run:${runId}`
    }
}
