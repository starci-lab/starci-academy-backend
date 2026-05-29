import {
    SubmissionType,
} from "@modules/databases"

/** Params for `UrlValidatorService.isValid`. */
export interface IsUrlValidParams {
    /** Challenge submission id. */
    submissionId: string
    /** Challenge submission type. */
    submissionType: SubmissionType
    /** Submission URL to validate. */
    url: string
}
