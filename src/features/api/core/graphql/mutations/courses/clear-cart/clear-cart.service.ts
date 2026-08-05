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
    ClearCartCommand,
} from "./clear-cart.command"
import type {
    ClearCartResponseData,
} from "./graphql-types"

@Injectable()
/** Thin service that forwards the clearCart request to the CQRS command bus. */
export class ClearCartService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    /**
     * Dispatches the clearCart command and returns how many rows were removed.
     *
     * @param params - User/locale context for the mutation (no request payload).
     * @returns Number of cart rows removed.
     */
    async execute(
        params: ExecuteParams<void>,
    ): Promise<ClearCartResponseData> {
        // hand off to the command handler which wipes the user's cart
        return this.commandBus.execute(
            new ClearCartCommand(params),
        )
    }
}
