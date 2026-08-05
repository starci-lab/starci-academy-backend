import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    RemoveFromCartCommand,
} from "./remove-from-cart.command"
import type {
    RemoveFromCartRequest,
    RemoveFromCartResponseData,
} from "./graphql-types"

@Injectable()
/** Thin service that forwards the removeFromCart request to the CQRS command bus. */
export class RemoveFromCartService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    /**
     * Dispatches the removeFromCart command and returns the removal outcome.
     *
     * @param params - Request/user/locale context for the mutation.
     * @returns Whether a matching cart row was removed.
     */
    async execute(
        params: ExecuteParams<RemoveFromCartRequest>,
    ): Promise<RemoveFromCartResponseData> {
        // hand off to the command handler which performs the delete
        return this.commandBus.execute(
            new RemoveFromCartCommand(params),
        )
    }
}
