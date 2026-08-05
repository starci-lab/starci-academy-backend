import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsEmail,
    IsString,
    MaxLength,
    MinLength,
} from "class-validator"

@InputType({
    description: "Input for initiating forgot-password flow (OTP required).",
})
/**
 * Email + intended new password. The password is held on the OTP challenge
 * until verify — it is not written to Keycloak on this call.
 */
export class ForgotPasswordInitRequest {
    @Field(() => String,
        {
            description: "User email (used as Keycloak username).",
        })
    @IsEmail()
        email: string

    @Field(() => String,
        {
            description: "New password to be applied after OTP verification.",
        })
    @IsString()
    @MinLength(6)
    @MaxLength(256)
        newPassword: string
}