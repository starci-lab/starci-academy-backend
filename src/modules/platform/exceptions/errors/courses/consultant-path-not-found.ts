import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Consultant index whose headhunter mount path was missing. */
export interface ConsultantPathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    consultantIndex?: number
}

/** Aborts headhunter seed/load when the consultant folder is absent on the mount. */
export class ConsultantPathNotFoundException extends AbstractException {
    constructor({
        consultantIndex,
        originalError,
    }: ConsultantPathNotFoundExceptionMetadata) {
        super(
            "Headhunter mount path not found",
            "CONSULTANT_PATH_NOT_FOUND_EXCEPTION",
            {
                consultantIndex,
                originalError,
            },
        )
    }
}
