import {
    AbstractException,
} from "../abstract"

/** Metadata describing the malformed Concepts mount leaf. */
export interface ConceptMountInvalidExceptionMetadata {
    owner: string
    reason: string
}

/** Raised when an authored Concepts mount cannot be parsed safely. */
export class ConceptMountInvalidException extends AbstractException {
    constructor({
        owner,
        reason,
    }: ConceptMountInvalidExceptionMetadata) {
        super(
            `${owner} ${reason}`,
            "CONCEPT_MOUNT_INVALID_EXCEPTION",
            {
                owner,
                reason,
            },
        )
    }
}
