import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    EnqueueInviteGithubJobService,
    EventBus,
} from "@modules/bussiness"
import {
    AddGithubUserToTeamEvent,
} from "./add-github-user-to-team.event"

/**
 * Event-bus handler that materialises {@link AddGithubUserToTeamEvent}
 * into a queued `invite-github` BullMQ job.
 *
 * Callers should prefer {@link publish} over talking to
 * {@link EnqueueInviteGithubJobService} directly: the handler absorbs
 * the in-memory retry loop provided by {@link EventBus} so a transient
 * enqueue failure (e.g. Redis blip) does not drop the intent.
 */
@Injectable()
export class AddGithubUserToTeamEventHandler {
    private readonly logger = new Logger(AddGithubUserToTeamEventHandler.name)

    constructor(
        private readonly eventBus: EventBus,
        private readonly enqueueInviteGithubJobService: EnqueueInviteGithubJobService,
    ) {}

    /**
     * Dispatch the event. Resolves once the task has been accepted by
     * the event bus; actual job enqueueing happens asynchronously with
     * retry.
     */
    async publish(event: AddGithubUserToTeamEvent): Promise<void> {
        await this.eventBus.execute({
            name: `add-github-user-to-team.${event.userId}.${event.courseId}`,
            execute: async () => {
                await this.enqueueInviteGithubJobService.enqueue({
                    userId: event.userId,
                    courseId: event.courseId,
                    githubUsername: event.githubUsername,
                })
                this.logger.log(
                    `Queued invite-github job for user=${event.userId} course=${event.courseId} github=${event.githubUsername}`,
                )
            },
        })
    }
}
