import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    MountStorageService,
} from "@modules/filesystem/mount-storage.service"
import {
    Octokit,
} from "octokit"
import {
    GithubProfileMissingLoginException,
} from "@modules/platform/exceptions/errors/github/github-profile-missing-login"
import {
    GithubTokenExchangeFailedException,
} from "@modules/platform/exceptions/errors/github/github-token-exchange-failed"
import type {
    ExchangeGithubOAuthCodeForAccessTokenParams,
    ExchangeGithubOAuthCodeForAccessTokenResult,
    GetGithubAuthenticatedUserParams,
    GetGithubAuthenticatedUserResult,
} from "./types/github-oauth"

@Injectable()
/**
 * GitHub API service (OAuth + REST API) implemented with Octokit.
 */
export class GithubApiAuthService {
    constructor(
        private readonly mountStorageService: MountStorageService,
    ) {}

    /**
     * Exchanges OAuth `code` for a GitHub user access token.
     *
     * @param param - OAuth code
     * @returns Access token for GitHub API calls
     */
    async exchangeOAuthCodeForAccessToken(
        {
            code,
        }: ExchangeGithubOAuthCodeForAccessTokenParams,
    ): Promise<ExchangeGithubOAuthCodeForAccessTokenResult> {
        const octokit = new Octokit()

        const response = await octokit.request(
            "POST https://github.com/login/oauth/access_token",
            {
                client_id: envConfig().github.oauth.clientId,
                client_secret: this.mountStorageService.githubSecretKey.trim(),
                code,
                redirect_uri: envConfig().github.oauth.redirectUri,
                headers: {
                    accept: "application/json",
                },
            },
        )
        const accessToken = response.data.access_token

        if (!accessToken) {
            throw new GithubTokenExchangeFailedException({
            })
        }

        return {
            accessToken,
        }
    }

    /**
     * Loads the authenticated GitHub user profile using a user access token.
     *
     * @param param - Access token
     * @returns Minimal GitHub user profile
     */
    async getAuthenticatedUser(
        {
            accessToken,
        }: GetGithubAuthenticatedUserParams,
    ): Promise<GetGithubAuthenticatedUserResult> {
        const octokit = new Octokit(
            {
                auth: accessToken,
            }
        )
        const response = await octokit.request(
            "GET /user",
        )
        const login = response.data.login
        if (!login) {
            throw new GithubProfileMissingLoginException({
            })
        }
        return {
            user: {
                login,
            },
        }
    }

    
}

