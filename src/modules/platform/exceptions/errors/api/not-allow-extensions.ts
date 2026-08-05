import type {
    AbstractExceptionMetadata 
} from "../abstract"
import {
    AbstractException 
} from "../abstract"

/** Offending extension + allow-list + filename so the upload error names what was rejected. */
export interface NotAllowExtensionsExceptionMetadata extends AbstractExceptionMetadata {
    extensions: string[]
    extension: string
    fileName: string
}

/** Rejects the upload before storage — disallowed types must not land in the bucket. */
export class NotAllowExtensionsException extends AbstractException {
    constructor(
        { extensions, extension, fileName, originalError }: NotAllowExtensionsExceptionMetadata
    ) {
        super(
            `File extension "${extension}" is not allowed. Allowed extensions are: ${extensions.join(", ")}`,
            "NOT_ALLOW_EXTENSIONS_EXCEPTION",
            {
                extensions,
                extension,
                fileName,
                originalError,
            }
        )
    }
}
