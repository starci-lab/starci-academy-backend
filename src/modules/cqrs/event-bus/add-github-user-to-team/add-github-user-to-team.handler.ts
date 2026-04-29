import {
    Logger,
} from "@nestjs/common"
import {
    EnqueueResolveGithubJobService,
} from "@modules/bussiness"
import {
    AddGithubUserToTeamEvent,
} from "./add-github-user-to-team.event"
import {
    EventsHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "../../icqrs-handler"

/**
 * Event-bus handler that materialises {@link AddGithubUserToTeamEvent}
 * into a queued `invite-github` BullMQ job.
 *
 * Callers should prefer {@link publish} over talking to
 * {@link EnqueueResolveGithubJobService} directly: the handler absorbs
 * the in-memory retry loop provided by {@link EventBus} so a transient
 * enqueue failure (e.g. Redis blip) does not drop the intent.
 */
@EventsHandler(AddGithubUserToTeamEvent)
export class AddGithubUserToTeamHandler
    extends ICQRSHandler<AddGithubUserToTeamEvent, void>
    implements ICommandHandler<AddGithubUserToTeamEvent, void> {
    private readonly logger = new Logger(AddGithubUserToTeamHandler.name)

    constructor(
        private readonly enqueueResolveGithubJobService: EnqueueResolveGithubJobService,
    ) {
        super()
    }

    /**
     * Dispatch the event. Resolves once the task has been accepted by
     * the event bus; actual job enqueueing happens asynchronously with
     * retry.
     */
    protected override async process(event: AddGithubUserToTeamEvent): Promise<void> {
        await this.enqueueResolveGithubJobService.enqueue({
            userId: event.payload.userId,
            courseId: "!2",
            githubUsername: event.payload.githubUsername,
        })
    }
}
