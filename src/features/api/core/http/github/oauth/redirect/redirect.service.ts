import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    GithubOauthRedirectCommand,
    type GithubOauthRedirectCommandParams,
    type GithubOauthRedirectCommandResult,
} from "./redirect.command"

@Injectable()
export class GithubOauthRedirectCommandService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: GithubOauthRedirectCommandParams,
    ): Promise<GithubOauthRedirectCommandResult> {
        return this.commandBus.execute(
            new GithubOauthRedirectCommand(params),
        )
    }
}

