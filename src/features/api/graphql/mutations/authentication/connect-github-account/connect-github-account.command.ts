import {
    UserEntity,
} from "@modules/databases"
import {
    ConnectGithubAccountInput,
} from "./graphql-types"

export interface ConnectGithubAccountCommandParams {
    user: UserEntity
    input: ConnectGithubAccountInput
}

export class ConnectGithubAccountCommand {
    constructor(
        readonly params: ConnectGithubAccountCommandParams,
    ) {}
}
