import {
    envConfig 
} from "@modules/env"
import {
    Injectable,
} from "@nestjs/common"
import {
    BuildGithubAuthorizeRedirectUrlParams,
} from "./types"

@Injectable()
/**
 * Builds GitHub OAuth authorization URL.
 *
 * Note: `redirectUri` is provided by FE; ensure FE uses a registered/allowed redirect URI.
 */
export class GithubOauthRedirectService {
    /**
     * The GitHub OAuth authorization endpoint.
     */
    private readonly authorizeEndpoint = "https://github.com/login/oauth/authorize"
    /**
     * The default scope for GitHub OAuth.
     */
    private readonly defaultScope = "read:user user:email"

    /**
     * Builds the GitHub OAuth authorization URL.
     *
     * @param params - The parameters for building the GitHub OAuth authorization URL.
     * @returns The GitHub OAuth authorization URL.
     */
    buildAuthorizeRedirectUrl(
        {
            scope,
            state,
        }: BuildGithubAuthorizeRedirectUrlParams,
    ): string {
        /* Build the GitHub OAuth authorization URL */
        const url = new URL(this.authorizeEndpoint)
        /* Set the client ID */
        url.searchParams.set(
            "client_id",
            envConfig().github.oauth.clientId,
        )
        /* Set the redirect URI */
        url.searchParams.set(
            "redirect_uri",
            envConfig().github.oauth.redirectUri,
        )
        /* Set the scope */
        url.searchParams.set(
            "scope",
            scope ?? this.defaultScope,
        )
        /* Set the state */
        url.searchParams.set(
            "state",
            state ,
        )
        /* Return the GitHub OAuth authorization URL */
        return url.toString()
    }
}

