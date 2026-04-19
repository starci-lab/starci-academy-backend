import {
    Injectable,
    Logger,
    OnModuleDestroy,
} from "@nestjs/common"

export interface EventBusTask {
    name: string
    execute: () => Promise<void>
    retryDelayMs?: number
}

interface QueuedEventBusTask extends EventBusTask {
    attempt: number
    nextRunAt: number
}

/**
 * Lightweight internal event bus.
 *
 * Retries forever to avoid dropping events while process is alive.
 * For cross-restart durability, wire this to an outbox table + worker queue.
 */
@Injectable()
export class EventBus implements OnModuleDestroy {
    private readonly logger = new Logger(EventBus.name)

    private readonly queue: Array<QueuedEventBusTask> = []

    private isDraining = false

    private retryTimer?: NodeJS.Timeout

    async execute(task: EventBusTask): Promise<void> {
        this.queue.push(
            {
                ...task,
                attempt: 0,
                nextRunAt: Date.now(),
            },
        )
        this.scheduleDrain(0)
    }

    onModuleDestroy(): void {
        if (this.retryTimer) {
            clearTimeout(this.retryTimer)
        }
    }

    private scheduleDrain(delayMs: number): void {
        if (this.retryTimer) {
            return
        }
        this.retryTimer = setTimeout(
            () => {
                this.retryTimer = undefined
                void this.drain()
            },
            delayMs,
        )
    }

    private async drain(): Promise<void> {
        if (this.isDraining) {
            return
        }

        this.isDraining = true
        try {
            while (this.queue.length > 0) {
                const now = Date.now()
                const runnableIndex = this.queue.findIndex((item) => item.nextRunAt <= now)

                if (runnableIndex === -1) {
                    const earliestRunAt = Math.min(...this.queue.map((item) => item.nextRunAt))
                    this.scheduleDrain(Math.max(0,
                        earliestRunAt - now))
                    return
                }

                const task = this.queue.splice(runnableIndex,
                    1)[0]

                try {
                    await task.execute()
                } catch (error) {
                    const nextAttempt = task.attempt + 1
                    const baseDelayMs = task.retryDelayMs ?? 3_000
                    const delayFactor = Math.min(nextAttempt,
                        10)

                    this.logger.warn(
                        `Event ${task.name} failed on attempt ${nextAttempt}. Re-queueing.`,
                    )
                    this.logger.error(error)

                    this.queue.push(
                        {
                            ...task,
                            attempt: nextAttempt,
                            nextRunAt: Date.now() + baseDelayMs * delayFactor,
                        },
                    )
                }
            }
        } finally {
            this.isDraining = false
            if (this.queue.length > 0) {
                this.scheduleDrain(0)
            }
        }
    }
}
