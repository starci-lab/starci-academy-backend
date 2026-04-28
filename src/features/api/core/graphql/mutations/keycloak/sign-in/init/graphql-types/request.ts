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
    description: "Input for initiating sign-in with username/password (OTP confirmation required).",
})
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
}

