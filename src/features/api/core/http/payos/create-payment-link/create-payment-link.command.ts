import {
    CreatePaymentLinkRequest,
} from "./dtos"

export class CreatePaymentLinkCommand {
    constructor(
        readonly params: CreatePaymentLinkRequest,
    ) {}
}
