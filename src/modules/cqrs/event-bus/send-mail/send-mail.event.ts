import {
    SendMailPayload,
} from "@modules/bullmq"

export class SendMailEvent {
    constructor(
        readonly payload: SendMailPayload,
    ) {}
}