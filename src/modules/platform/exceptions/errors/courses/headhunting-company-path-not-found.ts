import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Company index whose headhunting mount path was missing. */
export interface HeadhuntingCompanyPathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    companyIndex?: number
}

/** Aborts company seed/load when the folder is absent on the mount. */
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
