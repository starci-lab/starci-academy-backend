import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface HeadhuntingCompanyPathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    companyIndex?: number
}

export class HeadhuntingCompanyPathNotFoundException extends AbstractException {
    constructor({
        companyIndex,
        originalError,
    }: HeadhuntingCompanyPathNotFoundExceptionMetadata) {
        super(
            "Headhunting company mount path not found",
            "HEADHUNTING_COMPANY_PATH_NOT_FOUND_EXCEPTION",
            {
                companyIndex,
                originalError,
            },
        )
    }
}
