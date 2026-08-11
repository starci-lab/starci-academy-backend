import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsEmail,
    IsString,
    IsOptional,
    Matches,
    MaxLength,
    MinLength,
} from "class-validator"

@InputType({
    description: "Input for initiating sign-in with username/password (OTP confirmation required).",
})
/**
 * Password is checked now but tokens are not returned yet -- they sit on the
 * OTP challenge until verify, so password-only phishing cannot finish login.
 */
export class SignInInitRequest {
    @Field(() => String,
        {
            description: "User email (used as Keycloak username).",
        })
    @IsEmail()
        email: string

    @Field(() => String,
        {
            description: "Password (verified server-side with Keycloak; tokens returned only after OTP).",
        })
    @IsString()
    @MinLength(6)
    @MaxLength(256)
        password: string

    @Field(() => String,
        {
            nullable: true,
            description: "6-digit authenticator code when TOTP is enabled.",
        })
    @IsOptional()
    @IsString()
    @Matches(/^\d{6}$/,
        {
            message: "Two-factor code must be 6 digits",
        })
        twoFactorCode?: string
}

