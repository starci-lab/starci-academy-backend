import {
    SendMailPayload,
} from "@modules/bullmq"

/**
 * CQRS event that asks a handler to enqueue a mail job -- emitters stay free of BullMQ
 * imports.
 */
export class SendMailEvent {
    constructor(
        readonly payload: SendMailPayload,
    ) {}
}