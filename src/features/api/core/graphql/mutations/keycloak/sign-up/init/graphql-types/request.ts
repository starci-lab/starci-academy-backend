import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsEmail,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from "class-validator"

@InputType({
    description: "Input for initiating sign-up (account creation) with Keycloak; OTP confirmation required to receive tokens.",
})
export class SignUpInitRequest {
    @Field(() => String,
        {
            description: "Email (also used as Keycloak username by default).",
        })
    @IsEmail()
        email: string

    @Field(() => String,
        {
            description: "Password to set for the new Keycloak user.",
        })
    @IsString()
    @MinLength(6)
    @MaxLength(256)
        password: string

    @Field(() => String,
        {
            nullable: true,
            description: "Optional username. If omitted, we use the email as username.",
        })
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(100)
        username?: string

    @Field(() => String,
        {
            nullable: true,
            description: "Optional first name for Keycloak profile.",
        })
    @IsOptional()
    @IsString()
    @MaxLength(100)
        firstName?: string

    @Field(() => String,
        {
            nullable: true,
            description: "Optional last name for Keycloak profile.",
        })
    @IsOptional()
    @IsString()
    @MaxLength(100)
        lastName?: string
}

