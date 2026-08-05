import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CartItemEntity,
} from "@modules/databases/postgresql/primary/entities/cart-item.entity"
import {
    AddToCartCommand,
} from "./add-to-cart.command"
import type {
    AddToCartRequest,
} from "./graphql-types/request"

@Injectable()
/** Thin service that forwards the addToCart request to the CQRS command bus. */
export class AddToCartService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    /**
     * Dispatches the addToCart command and returns the resulting cart row.
     *
     * @param params - Request/user/locale context for the mutation.
     * @returns The cart row holding the course after the add.
     */
    async execute(
        params: ExecuteParams<AddToCartRequest>,
    ): Promise<CartItemEntity> {
        // hand off to the command handler which performs the DB work
        return this.commandBus.execute(
            new AddToCartCommand(params),
        )
    }
}
