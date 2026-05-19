import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface HeadhuntingCompanyNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    displayId?: string
}

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
