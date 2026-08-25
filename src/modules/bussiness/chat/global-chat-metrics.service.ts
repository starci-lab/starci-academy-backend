import {
    Injectable 
} from "@nestjs/common"

@Injectable()
/** Low-cardinality operational counters; payloads never include actors or content. */
export class GlobalChatMetricsService {
    private acceptedCommands = 0
    private replayedCommands = 0
    private outboxFailures = 0
    private lastOutboxLagMs = 0

    commandAccepted(): void {
        this.acceptedCommands += 1
    }

    commandReplayed(): void {
        this.replayedCommands += 1
    }

    outboxPublished(lagMs: number): void {
        this.lastOutboxLagMs = Math.max(0,
            Math.floor(lagMs))
    }

    outboxFailed(): void {
        this.outboxFailures += 1
    }

    snapshot(): Record<string, number> {
        return {
            acceptedCommands: this.acceptedCommands,
            replayedCommands: this.replayedCommands,
            outboxFailures: this.outboxFailures,
            lastOutboxLagMs: this.lastOutboxLagMs,
        }
    }

    logOutboxFailure(): void {
        this.outboxFailed()
    }
}
