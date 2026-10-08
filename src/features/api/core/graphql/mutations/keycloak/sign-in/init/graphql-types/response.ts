import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Sign-in init payload: a completed session, or an OTP challenge when the email OTP step is enabled.",
})
/**
 * Public result of sign-in init. Users receive a session directly; a challenge
 * is returned only while the email OTP step is enabled.
 */
export class SignInInitData {
    @Field(() => String,
        {
            nullable: true,
            description: "Opaque challenge id; use it for signInVerifyOtp.",
        })
        challengeId?: string

    @Field(() => Int,
        {
            nullable: true,
            description: "OTP expiry in seconds.",
        })
        expiresInSeconds?: number

    @Field(() => String,
        {
            nullable: true,
            description: "Access token when sign-in completes immediately (email OTP step disabled).",
        })
        accessToken?: string
}

/** Internal sign-in init result; impossible mixed challenge/session states do not compile. */
export type SignInInitResponse =
    | {
        kind: "challenge"
        data: Required<Pick<SignInInitData, "challengeId" | "expiresInSeconds">>
    }
    | {
        kind: "session"
        data: Required<Pick<SignInInitData, "accessToken">>
        refreshToken: string
    }

@ObjectType({
    description: "Response wrapper for the signInInit mutation.",
})
/**
 * Envelope reused by sign-in and forgot-password init/resend. `data` is
 * nullable for the interceptor error path.
 */
export class SignInResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<SignInInitData>
{
    @Field(() => SignInInitData,
        {
            nullable: true,
            description: "Completed session or sign-in challenge payload.",
        })
        data: SignInInitData
}

