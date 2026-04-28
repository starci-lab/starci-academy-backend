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
    /**
     * The refresh token returned from the command.
     */
    refreshToken: string
}

@ObjectType({
    description: "Response wrapper for refresh mutation.",
})
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

