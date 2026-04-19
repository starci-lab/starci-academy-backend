import {
    UserEntity,
} from "@modules/databases"
import {
    ConnectGithubAccountInput,
} from "@features/api/graphql/mutations/authentication/connect-github-account/graphql-types"

export class ConnectGithubAccountCommand {
    constructor(
        readonly user: UserEntity,
        readonly input: ConnectGithubAccountInput,
    ) {}
}
