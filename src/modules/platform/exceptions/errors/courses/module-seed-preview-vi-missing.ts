import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

export interface ModuleSeedPreviewViMissingExceptionMetadata extends AbstractExceptionMetadata {
    courseIndex: number
    moduleIndex: number
    orderIndex: number
}

/**
 * Vietnamese module markdown has no preview bullet matching an English preview line order.
 */
export class ModuleSeedPreviewViMissingException extends AbstractException {
    constructor(
        {
            courseIndex,
            moduleIndex,
            orderIndex,
            originalError,
        }: ModuleSeedPreviewViMissingExceptionMetadata,
    ) {
        super(
            `Module seed: Preview Contents line order ${orderIndex} missing in vi.md (course ${courseIndex}, module ${moduleIndex})`,
            "MODULE_SEED_PREVIEW_VI_MISSING_EXCEPTION",
            {
                courseIndex,
                moduleIndex,
                orderIndex,
                originalError,
            },
        )
    }
}
