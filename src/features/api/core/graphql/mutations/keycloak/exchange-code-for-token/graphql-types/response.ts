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
    /**
     * The refresh token returned from the command.
     */
    refreshToken: string
}

@ObjectType({
    description: "Response wrapper for exchangeCodeForToken mutation.",
})
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

