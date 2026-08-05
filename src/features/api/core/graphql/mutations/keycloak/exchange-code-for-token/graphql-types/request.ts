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
} from "@modules/integrations/keycloak/types/tokens"

@InputType({
    description: "Request for exchanging OIDC authorization code for tokens.",
})
/**
 * Callback payload from the identity broker. `state` must match the server-started
 * redirect so a stolen `code` alone cannot complete login without the PKCE bundle.
 */
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
            description: "OAuth `state` returned by Keycloak (matches the redirect flow started on the server).",
        },
    )
    @IsString()
    @MinLength(1)
        state: string
}

