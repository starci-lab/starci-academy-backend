import {
    InviteGithubPayload,
} from "@modules/bullmq"

/**
 * Event emitted when a user's GitHub identity has been verified and the
 * system wants them added to the organisation/team associated with a
 * course enrolment.
 *
 * The event bus converts this into an `invite-github` BullMQ job so
 * retries survive process restarts.
 */
export class AddGithubUserToTeamEvent {
    constructor(
        readonly payload: InviteGithubPayload,
    ) {}
}
