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
    PayNextInstallmentCommand,
} from "./pay-next-installment.command"
import {
    PayNextInstallmentRequest,
    PayNextInstallmentResponseData,
} from "./graphql-types"

@Injectable()
/**
 * Thin service that dispatches "pay next installment cycle" to its command handler.
 */
export class PayNextInstallmentService {
    constructor(
        private readonly commandBus: CommandBus,
    ) { }

    /**
     * Dispatch the pay-next-installment command.
     *
     * @param params - Request + auth context from the resolver.
     * @returns The checkout payload built by the handler.
     */
    async execute(
        params: ExecuteParams<PayNextInstallmentRequest>,
    ): Promise<PayNextInstallmentResponseData> {
        return this.commandBus.execute(
            new PayNextInstallmentCommand(params),
        )
    }
}
