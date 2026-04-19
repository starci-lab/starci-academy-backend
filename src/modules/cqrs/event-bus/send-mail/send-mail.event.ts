import {
    SendMailPayload,
} from "@modules/bullmq"

/**
 * Event emitted when the application wants to deliver a transactional
 * email through the Mailcow gateway.
 *
 * This is a thin alias over {@link SendMailPayload} so higher layers do
 * not have to import from `@modules/bullmq`; the shape is intentionally
 * identical because the event bus forwards it straight into the
 * `send-mail` BullMQ queue.
 */
export type SendMailEvent = SendMailPayload

/**
 * Dedup key used for {@link EventBus} task names.
 * Kept as a helper so callers can build readable names.
 */
export const buildSendMailEventName = (event: SendMailEvent): string => {
    const first = event.to[0]?.address ?? "unknown"
    return `send-mail.${first}.${event.subject}`
}
