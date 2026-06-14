import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    IsString,
    MinLength,
} from "class-validator"

/** Request to disable two-factor; the code proves ownership of the device. */
@InputType({
    description: "Request to disable two-factor (TOTP).",
})
export class DisableTwoFactorRequest {
    @Field(
        () => String,
        {
            description: "A current TOTP code, required only while 2FA is enabled.",
        },
    )
    @IsString()
    // 6-digit codes; min-length guard rejects obviously empty input early
    @MinLength(6)
        code: string
}
