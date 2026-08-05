import {
    CreatePaymentLinkRequest,
} from "./dtos/request"

/**
 * CQRS envelope for minting a PayOS checkout URL so the controller never imports the PayOS
 * SDK.
 */
export class CreatePaymentLinkCommand {
    constructor(
        readonly params: CreatePaymentLinkRequest,
    ) {}
}
