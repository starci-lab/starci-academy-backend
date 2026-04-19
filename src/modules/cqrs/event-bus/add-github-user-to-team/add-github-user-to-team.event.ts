/**
 * Event emitted when a user's GitHub identity has been verified and the
 * system wants them added to the organisation/team associated with a
 * course enrolment.
 *
 * The event bus converts this into an `invite-github` BullMQ job so
 * retries survive process restarts.
 */
export interface AddGithubUserToTeamEvent {
    /** ID of the user in the primary database. */
    userId: string
    /** ID of the course whose team the user should join. */
    courseId: string
    /** GitHub username (login) to invite. */
    githubUsername: string
}
