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

    @Field(() => String)
        refreshToken: string

    @Field(() => String)
        tokenType: string

    @Field(() => Number)
        expiresIn: number

    @Field(() => String,
        {
            nullable: true,
        })
        idToken?: string

    @Field(() => String)
        scope: string

    @Field(() => String)
        sessionState: string
}

@ObjectType({
    description: "Response wrapper for refresh mutation.",
})
export class RefreshTokenResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<RefreshTokenData>
{
    @Field(() => RefreshTokenData)
        data: RefreshTokenData
}

