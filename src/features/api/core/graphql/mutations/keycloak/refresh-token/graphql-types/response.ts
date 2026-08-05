import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "Keycloak tokens refreshed from a refresh token.",
})
/**
 * Client-visible half of a refresh: only the new access token. The rotated
 * refresh token is re-cookied by the resolver so JS never sees it.
 */
export class RefreshTokenData {
    @Field(() => String)
        accessToken: string
}

/** Result of the refreshToken command. */
export interface RefreshTokenCommandResult {
    /**
     * The data returned from the command.
     */
    data: RefreshTokenData
    refreshToken: string
}

@ObjectType({
    description: "Response wrapper for refresh mutation.",
})
/**
     * The refresh token returned from the command.
     */
export class RefreshTokenResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<RefreshTokenData>
{
    @Field(() => RefreshTokenData,
        {
            nullable: true,
        })
        data: RefreshTokenData
}

