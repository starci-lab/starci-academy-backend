import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    IsInt,
    IsOptional,
    Min,
} from "class-validator"

@InputType({
    description: "Optional arguments for refreshToken when using access-token TTL checks.",
})
/**
 * Optional TTL gate so the client can skip a Keycloak round-trip when the
 * current access token is still good enough -- cuts refresh storms on tab focus.
 */
export class RefreshTokenRequest {
    @Field(
        () => Int,
        {
            nullable: true,
            description:
                "Skip Keycloak refresh while access token TTL (seconds) is greater than this value.",
        },
    )
    @IsOptional()
    @IsInt()
    @Min(0)
        minValiditySeconds?: number
}

