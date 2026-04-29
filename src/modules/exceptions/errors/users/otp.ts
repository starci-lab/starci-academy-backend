/**
 * Sign-in OTP Exceptions
 * Errors related to sign-in OTP operations
 */

import type {
    AbstractExceptionMetadata 
} from "../abstract"
import {
    AbstractException 
} from "../abstract"

/** Thrown when sign-in OTP is not found */
export interface SignInOtpNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    email: string
}

/** Thrown when sign-in OTP is not found. */
export class SignInOtpNotFoundException extends AbstractException {
    constructor(
        {
            email,
            originalError,
        }: SignInOtpNotFoundExceptionMetadata
    ) {
        super(
            "Sign in OTP not found",
            "SIGN_IN_OTP_NOT_FOUND_EXCEPTION",
            {
                email,
                originalError,
            }
        )
    }
}

/** Thrown when sign-in OTP does not match */
export interface SignInOtpMismatchExceptionMetadata extends AbstractExceptionMetadata {
    email: string
}

/** Thrown when sign-in OTP does not match. */
export class SignInOtpMismatchException extends AbstractException {
    constructor(
        {
            email,
            originalError,
        }: SignInOtpMismatchExceptionMetadata
    ) {
        super(
            "Sign in OTP mismatch",
            "SIGN_IN_OTP_MISMATCH_EXCEPTION",
            {
                email,
                originalError,
            }
        )
    }
}

/** Thrown when a login challenge exists but stored tokens are missing (unexpected state). */
export interface ChallengeTokensNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    challengeId: string
}

/** Thrown when challenge tokens are missing. */
export class ChallengeTokensNotFoundException extends AbstractException {
    constructor(
        {
            challengeId,
            originalError,
        }: ChallengeTokensNotFoundExceptionMetadata
    ) {
        super(
            "Challenge tokens not found",
            "CHALLENGE_TOKENS_NOT_FOUND_EXCEPTION",
            {
                challengeId,
                originalError,
            }
        )
    }
}

/** Thrown when a login challenge exists but stored email is missing (unexpected state). */
export interface ChallengeEmailNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    challengeId: string
}

/** Thrown when challenge email is missing. */
export class ChallengeEmailNotFoundException extends AbstractException {
    constructor(
        {
            challengeId,
            originalError,
        }: ChallengeEmailNotFoundExceptionMetadata
    ) {
        super(
            "Challenge email not found",
            "CHALLENGE_EMAIL_NOT_FOUND_EXCEPTION",
            {
                challengeId,
                originalError,
            }
        )
    }
}

/** Thrown when a login challenge id is missing/expired. */
export interface ChallengeOtpNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    challengeId: string
}

/** Thrown when the challenge is not found. */
export class ChallengeOtpNotFoundException extends AbstractException {
    constructor(
        {
            challengeId,
            originalError,
        }: ChallengeOtpNotFoundExceptionMetadata
    ) {
        super(
            "Challenge not found",
            "CHALLENGE_NOT_FOUND_EXCEPTION",
            {
                challengeId,
                originalError,
            }
        )
    }
}

/** Thrown when OTP mismatches for the given challenge. */
export interface ChallengeOtpMismatchExceptionMetadata extends AbstractExceptionMetadata {
    challengeId: string
}

/** Thrown when the OTP does not match. */
export class ChallengeOtpMismatchException extends AbstractException {
    constructor(
        {
            challengeId,
            originalError,
        }: ChallengeOtpMismatchExceptionMetadata
    ) {
        super(
            "Challenge OTP mismatch",
            "CHALLENGE_OTP_MISMATCH_EXCEPTION",
            {
                challengeId,
                originalError,
            }
        )
    }
}
