import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Why a voucher code was rejected. */
export type InvalidVoucherReason = "unknown" | "expired" | "alreadyUsed" | "wrongCourse"

/** Metadata for {@link InvalidVoucherException}. */
export interface InvalidVoucherExceptionMetadata extends AbstractExceptionMetadata {
    /** Why the code was rejected. */
    reason: InvalidVoucherReason
}

/** Human copy per rejection reason, keyed for the constructor message. */
const REASON_MESSAGE: Record<InvalidVoucherReason, string> = {
    unknown: "Voucher code not found",
    expired: "Voucher code has expired",
    alreadyUsed: "Voucher code has already been used",
    wrongCourse: "Voucher code is not valid for this course",
}

/**
 * A voucher code submitted at checkout is not redeemable: unknown/not-owned,
 * expired, already reserved/used, or scoped to a different course than the
 * one being checked out.
 */
export class InvalidVoucherException extends AbstractException {
    constructor(
        {
            reason,
            originalError,
        }: InvalidVoucherExceptionMetadata,
    ) {
        super(
            REASON_MESSAGE[reason],
            "INVALID_VOUCHER_EXCEPTION",
            {
                reason,
                originalError,
            },
        )
    }
}
