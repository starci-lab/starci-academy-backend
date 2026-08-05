import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "TOTP enrollment material (show the QR, then confirm with a code).",
})
/** Enrollment material returned when starting 2FA setup. */
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

@ObjectType({
    description: "Response for starting two-factor (TOTP) setup.",
})
/** Response for starting two-factor setup. */
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
