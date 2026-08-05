import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    GithubOauthCallbackCommand,
    type GithubOauthCallbackCommandParams,
    type GithubOauthCallbackResult,
} from "./callback.command"

@Injectable()
/**
 * Dispatches the GitHub OAuth callback through the command bus so the redirect controller
 * does not import Octokit or crypto.
 */
export class GithubOauthCallbackService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        params: GithubOauthCallbackCommandParams,
    ): Promise<GithubOauthCallbackResult> {
        return this.commandBus.execute(
            new GithubOauthCallbackCommand(params),
        )
    }
}

