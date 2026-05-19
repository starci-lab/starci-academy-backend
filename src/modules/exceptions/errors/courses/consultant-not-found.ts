import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ConsultantNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    id?: string
    displayId?: string
}

export class ConsultantNotFoundException extends AbstractException {
    constructor({
        id,
        displayId,
        originalError,
    }: ConsultantNotFoundExceptionMetadata) {
        super(
            "Consultant not found",
            "CONSULTANT_NOT_FOUND_EXCEPTION",
            {
                id,
                displayId,
                originalError,
            },
        )
    }
}
