import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    RefundCoursePurchaseRequest,
} from "./graphql-types/request"

/** Carries a provider-confirmed course refund from any door to its single handler. */
export class RefundCoursePurchaseCommand {
    constructor(
        readonly params: ExecuteParams<RefundCoursePurchaseRequest>,
    ) {}
}
