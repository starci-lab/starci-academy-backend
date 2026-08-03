import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a template CV id does not exist. */
export interface TemplateCVNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** `template_cvs.id`. */
    id: string
}

/** Thrown when no template CV matches the requested id. */
export class TemplateCVNotFoundException extends AbstractException {
    constructor({
        id,
        originalError,
    }: TemplateCVNotFoundExceptionMetadata) {
        super(
            "Template CV not found",
            "TEMPLATE_CV_NOT_FOUND_EXCEPTION",
            {
                id,
                originalError,
            },
        )
    }
}
