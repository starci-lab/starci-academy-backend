import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsJWT,
} from "class-validator"

@InputType({
    description: "Request for refreshing Keycloak tokens.",
})
export class RefreshTokenRequest {
    @Field(() => String,
        {
            description: "Refresh token received from Keycloak.",
        })
    @IsJWT()
        refreshToken: string
}

