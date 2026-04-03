import {
    SubmissionType,
} from "@modules/databases"

/** GitHub repository or profile URL (https only). */
export const GITHUB_REGEX =
    /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+(\/[A-Za-z0-9_.-]+)?(\/)?$/

/** Google Docs / Sheets / Slides document URL. */
export const GOOGLE_DOCS_REGEX =
    /^https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/[A-Za-z0-9_-]+/

/**
 * Whether `url` matches the expected pattern for the challenge submission type.
 */
export function isSubmissionUrlValidForType(
    type: SubmissionType,
    url: string,
): boolean {
    const trimmed = url.trim()
    switch (type) {
    case SubmissionType.GithubUrl:
        return GITHUB_REGEX.test(trimmed)
    case SubmissionType.GoogleDocsUrl:
        return GOOGLE_DOCS_REGEX.test(trimmed)
    default:
        return false
    }
}
