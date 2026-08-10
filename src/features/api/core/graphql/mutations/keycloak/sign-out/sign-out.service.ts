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
    SignOutCommand,
} from "./sign-out.command"
import type {
    SignOutRequest,
} from "./graphql-types/request"

@Injectable()
/** Thin service that forwards the signOut request to the CQRS command bus. */
export class SignOutService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    /**
     * Dispatches the signOut command.
     *
     * @param params - Request/user/locale context for the mutation.
     */
    async execute(
        params: ExecuteParams<SignOutRequest>,
    ): Promise<undefined> {
        // hand off to the command handler which revokes the token at Keycloak
        return this.commandBus.execute(
            new SignOutCommand(params),
        )
    }
}
