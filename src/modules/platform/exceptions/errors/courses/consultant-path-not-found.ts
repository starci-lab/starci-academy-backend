import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ConsultantPathNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    consultantIndex?: number
}

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
