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
    PurchaseAiSubscriptionCommand,
} from "./purchase-ai-subscription.command"
import {
    PurchaseAiSubscriptionRequest,
    PurchaseAiSubscriptionResponseData,
} from "./graphql-types"

@Injectable()
/**
 * Thin command-bus hop so the resolver stays GraphQL-shaped and checkout
 * retries / provider branching stay inside the CQRS handler.
 */
export class PurchaseAiSubscriptionService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    async execute(
        params: ExecuteParams<PurchaseAiSubscriptionRequest>,
    ): Promise<PurchaseAiSubscriptionResponseData> {
        return this.commandBus.execute(
            new PurchaseAiSubscriptionCommand(params),
        )
    }
}
