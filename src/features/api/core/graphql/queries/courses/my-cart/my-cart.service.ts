import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    CartItemEntity,
} from "@modules/databases/postgresql/primary/entities/cart-item.entity"
import {
    MyCartQuery,
} from "./my-cart.query"

@Injectable()
/** Thin service that forwards the myCart request to the CQRS query bus. */
export class MyCartService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * Dispatches the myCart query and returns the caller's cart rows.
     *
     * @param params - User/locale context for the query (no request payload).
     * @returns The current user's cart rows with course relations loaded.
     */
    async execute(
        params: ExecuteParams<void>,
    ): Promise<Array<CartItemEntity>> {
        // hand off to the query handler which reads the user's cart from the DB
        return this.queryBus.execute(
            new MyCartQuery(params),
        )
    }
}
