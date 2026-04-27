import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsEmail,
    IsString,
    MinLength,
    MaxLength,
} from "class-validator"

@InputType({
    description: "Input for initiating login with email/password (OTP will be required).",
})
export class LoginInitInput {
    @Field(() => String,
        {
            description: "User email (used as Keycloak username).",
        })
    @IsEmail()
        email: string

    @Field(() => String,
        {
            description: "User password (verified server-side with Keycloak; no tokens returned yet).",
        })
    @IsString()
    @MinLength(6)
    @MaxLength(256)
        password: string
}

