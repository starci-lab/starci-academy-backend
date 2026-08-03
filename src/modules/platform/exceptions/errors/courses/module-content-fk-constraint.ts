import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for {@link ModuleContentFKConstraintException}. */
export interface ModuleContentFKConstraintExceptionMetadata extends AbstractExceptionMetadata {
    /** Content row id from the seed payload. */
    contentId?: string
    /** Module id when partially present on the payload. */
    moduleId?: string
}

/**
 * Thrown when a content seed row cannot be upserted because the parent module FK is missing.
 */
export class ModuleContentFKConstraintException extends AbstractException {
    constructor({
        contentId,
        moduleId,
        originalError,
    }: ModuleContentFKConstraintExceptionMetadata) {
        super(
            "Content seed is missing module FK (module.id or moduleId)",
            "MODULE_CONTENT_FK_CONSTRAINT_EXCEPTION",
            {
                contentId,
                moduleId,
                originalError,
            },
        )
    }
}
