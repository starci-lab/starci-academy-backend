import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a headhunting company cannot be located by either lookup key. */
export interface HeadhuntingCompanyNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Elasticsearch document id the lookup was attempted with, when the caller looked up by id. */
    id?: string
    /** Public-facing display id the lookup was attempted with, when the caller looked up by displayId. */
    displayId?: string
}

/**
 * Thrown when neither an id nor a displayId resolves to a headhunting company
 * document, or when neither key was supplied at all. Both lookup paths
 * (`getById` and `getByDisplayId`) throw this on a miss, so `id`/`displayId`
 * on the metadata indicate which lookup was attempted.
 */
export class HeadhuntingCompanyNotFoundException extends AbstractException {
    constructor({
        id,
        displayId,
        originalError,
    }: HeadhuntingCompanyNotFoundExceptionMetadata) {
        super(
            "Headhunting company not found",
            "HEADHUNTING_COMPANY_NOT_FOUND_EXCEPTION",
            {
                id,
                displayId,
                originalError,
            },
        )
    }
}
