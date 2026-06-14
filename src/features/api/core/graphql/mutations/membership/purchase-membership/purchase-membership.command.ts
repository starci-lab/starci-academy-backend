import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    PurchaseMembershipRequest,
} from "./graphql-types"

export class PurchaseMembershipCommand {
    constructor(
        readonly params: ExecuteParams<PurchaseMembershipRequest>,
    ) { }
}
