import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** Enrollment material returned when starting 2FA setup. */
@ObjectType({
    description: "TOTP enrollment material (show the QR, then confirm with a code).",
})
export class SetupTwoFactorData {
    @Field(
        () => String,
        {
            description: "Base32-encoded shared secret (for manual entry).",
        },
    )
        secret: string

    @Field(
        () => String,
        {
            description: "otpauth:// URI to render as a QR code in an authenticator app.",
        },
    )
        otpauthUrl: string
}

/** Response for starting two-factor setup. */
@ObjectType({
    description: "Response for starting two-factor (TOTP) setup.",
})
export class SetupTwoFactorResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SetupTwoFactorData>
{
    @Field(
        () => SetupTwoFactorData,
        {
            nullable: true,
            description: "The TOTP enrollment material.",
        },
    )
        data: SetupTwoFactorData
}
