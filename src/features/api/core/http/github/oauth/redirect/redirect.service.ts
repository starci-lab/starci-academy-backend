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
/**
 * Dispatches the GitHub OAuth start through the command bus so the controller only issues
 * the 302.
 */
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

