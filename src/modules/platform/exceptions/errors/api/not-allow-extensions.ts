import type {
    AbstractExceptionMetadata 
} from "../abstract"
import {
    AbstractException 
} from "../abstract"

export interface NotAllowExtensionsExceptionMetadata extends AbstractExceptionMetadata {
    extensions: string[]
    extension: string
    fileName: string
}

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
