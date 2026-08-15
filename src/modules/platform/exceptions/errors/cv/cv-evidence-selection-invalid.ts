import {
    HttpStatus,
} from "@nestjs/common"
import type {
    CvEvidenceInvalidItem,
} from "@modules/bussiness/cv-evidence/types/cv-evidence"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata identifying every rejected capstone selection and its stable reason. */
export interface CvEvidenceSelectionInvalidExceptionMetadata extends AbstractExceptionMetadata {
    invalid: Array<CvEvidenceInvalidItem>
}

/** Thrown when any selected capstone is duplicated, absent, failed or not owned by the caller. */
export class CvEvidenceSelectionInvalidException extends AbstractException {
    constructor({ invalid, originalError }: CvEvidenceSelectionInvalidExceptionMetadata) {
        super(
            "One or more selected CV capstones are invalid.",
            "CV_EVIDENCE_SELECTION_INVALID_EXCEPTION",
            {
                invalid,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
