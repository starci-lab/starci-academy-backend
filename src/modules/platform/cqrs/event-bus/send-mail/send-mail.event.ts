import {
    SendMailPayload,
} from "@modules/integrations/bullmq/types/payloads/send-mail"

/**
 * CQRS event that asks a handler to enqueue a mail job -- emitters stay free of BullMQ
 * imports.
 */
export class SendMailEvent {
    constructor(
        readonly payload: SendMailPayload,
    ) {}
}