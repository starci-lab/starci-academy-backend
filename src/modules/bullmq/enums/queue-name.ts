/**
 * Enum of BullMQ queue names used across the system.
 * Each name corresponds to a specific type of background job queue.
 */
export enum BullQueueName {
    /** Queue name for enroll jobs. */
    Enroll = "enroll",
    /** Queue for grading a GitHub-linked challenge submission. */
    ProcessGitSubmission = "process-git-submission",
    /** Queue for grading a Google Docs/Sheets-linked challenge submission. */
    ProcessGoogleDocsSubmission = "process-google-docs-submission",
    /** Queue for inviting users to GitHub organization/team. */
    InviteGithub = "invite-github",
    /** Queue for grading a CV challenge submission. */
    ProcessCvSubmission = "process-cv-submission",
    /** Queue for processing video (encode mp4/mkv to mpeg-dash and hls). */
    ProcessVideo = "process-video",
    /** Queue for sending transactional emails via SMTP (Mailcow). */
    SendMail = "send-mail",
}
