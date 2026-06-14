import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    PurchaseMembershipCommand,
} from "./purchase-membership.command"
import {
    PurchaseMembershipRequest,
    PurchaseMembershipResponseData,
} from "./graphql-types"

@Injectable()
export class PurchaseMembershipService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<PurchaseMembershipRequest>,
    ): Promise<PurchaseMembershipResponseData> {
        return this.commandBus.execute(
            new PurchaseMembershipCommand(params),
        )
    }
}
