import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsString,
    MinLength,
} from "class-validator"

@InputType({
    description: "Request to confirm two-factor (TOTP) setup.",
})
/** Request to confirm two-factor setup with a code from the authenticator. */
export class ConfirmTwoFactorRequest {
    @Field(
        () => String,
        {
            description: "The current TOTP code shown by the authenticator app.",
        },
    )
    @IsString()
    // 6-digit codes; min-length guard rejects obviously empty input early
    @MinLength(6)
        code: string
}
