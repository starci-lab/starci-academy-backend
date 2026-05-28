import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    PurchaseAiSubscriptionRequest,
} from "./graphql-types"

export class PurchaseAiSubscriptionCommand {
    constructor(
        readonly params: ExecuteParams<PurchaseAiSubscriptionRequest>,
    ) { }
}
