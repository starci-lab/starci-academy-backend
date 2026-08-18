import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ConnectGithubAccountInput,
} from "./graphql-types/input"

/**
 * Handler input for connectGithubAccount -- typed here (not ExecuteParams)
 * because the mutation takes a named `input` arg rather than `request`.
 */
export interface ConnectGithubAccountParams {
    user: UserEntity
    input: ConnectGithubAccountInput
}

/**
 * CQRS envelope so GitHub username verification stays off the resolver and
 * can be retried / tested without spinning up GraphQL.
 */
export class ConnectGithubAccountCommand {
    constructor(
        readonly params: ConnectGithubAccountParams,
    ) {}
}
