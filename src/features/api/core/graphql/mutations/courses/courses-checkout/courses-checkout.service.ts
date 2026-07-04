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
    CoursesCheckoutCommand,
} from "./courses-checkout.command"
import type {
    CoursesCheckoutRequest,
    CoursesCheckoutResponseData,
} from "./graphql-types"

/**
 * Thin service that dispatches the multi-course checkout to its command handler.
 */
@Injectable()
export class CoursesCheckoutService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    /**
     * Dispatch the checkout command.
     *
     * @param params - Request + auth context from the resolver.
     * @returns The checkout payload built by the handler.
     */
    async execute(
        params: ExecuteParams<CoursesCheckoutRequest>,
    ): Promise<CoursesCheckoutResponseData> {
        // hand off to the CQRS handler which prices, persists and calls the gateway
        return this.commandBus.execute(
            new CoursesCheckoutCommand(params),
        )
    }
}
