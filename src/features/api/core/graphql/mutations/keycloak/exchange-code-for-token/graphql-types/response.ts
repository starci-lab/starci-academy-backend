import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Keycloak tokens exchanged from an authorization code.",
})
/**
 * Client-visible half of the exchange: only the access token. The refresh token
 * is httpOnly-cookied by the resolver so JS never sees it.
 */
export class ExchangeCodeForTokenData {
    @Field(() => String)
        accessToken: string
}

/**
 * Result of the exchangeCodeForToken command.
 */
export interface ExchangeCodeForTokenCommandResult {
    /**
     * The data returned from the command.
     */
    data: ExchangeCodeForTokenData
    refreshToken: string
}

@ObjectType({
    description: "Response wrapper for exchangeCodeForToken mutation.",
})
    /**
     * The refresh token returned from the command.
     */
export class ExchangeCodeForTokenResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ExchangeCodeForTokenData>
{
    @Field(() => ExchangeCodeForTokenData,
        {
            nullable: true,
        })
        data: ExchangeCodeForTokenData
}

