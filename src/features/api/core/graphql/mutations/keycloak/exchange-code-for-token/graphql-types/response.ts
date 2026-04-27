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
    description: "Response wrapper for exchangeCodeForToken mutation.",
})
export class ExchangeCodeForTokenResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ExchangeCodeForTokenData>
{
    @Field(() => ExchangeCodeForTokenData)
        data: ExchangeCodeForTokenData
}

