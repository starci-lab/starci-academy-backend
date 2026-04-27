import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsString,
    MinLength,
} from "class-validator"
import {
    GraphQLKeycloakIdentityProvider,
    KeycloakIdentityProvider,
} from "@modules/keycloak"

@InputType({
    description: "Request for exchanging OIDC authorization code for tokens.",
})
export class ExchangeCodeForTokenRequest {
    @Field(() => String,
        {
            description: "OIDC authorization code returned by Keycloak broker callback.",
        })
    @IsString()
    @MinLength(1)
        code: string

    @Field(() => GraphQLKeycloakIdentityProvider,
        {
            description: "Identity provider used for the callback redirect URI resolution.",
        })
        provider: KeycloakIdentityProvider

    @Field(
        () => String,
        {
            nullable: true,
            description: "Redirect URI used when the authorization code was issued (must match exactly).",
        },
    )
    @IsString()
        redirectUri?: string
}

