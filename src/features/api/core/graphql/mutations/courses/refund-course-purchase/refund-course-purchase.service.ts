import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import {
    RefundCoursePurchaseCommand,
} from "./refund-course-purchase.command"
import type {
    RefundCoursePurchaseRequest,
} from "./graphql-types/request"
import type {
    RefundCoursePurchaseData,
} from "./graphql-types/response"

@Injectable()
/** Keeps the GraphQL door independent of the command bus by doing dispatch only. */
export class RefundCoursePurchaseService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    /**
     * Sends the complete request context to the refund handler.
     *
     * @param params - Provider evidence and request context from the active door.
     * @returns The committed refund and its entitlement effects.
     */
    async execute(
        params: ExecuteParams<RefundCoursePurchaseRequest>,
    ): Promise<RefundCoursePurchaseData> {
        return this.commandBus.execute(
            new RefundCoursePurchaseCommand(params),
        )
    }
}
