import {
    Injectable
} from "@nestjs/common"
import {
    InvalidUrlException,
    SubmissionUrlInvalidException,
} from "@modules/exceptions"
import {
    SubmissionType,
} from "@modules/databases"
import type {
    IsUrlValidParams,
} from "./types"

@Injectable()
/** Service for validating URLs. */
export class UrlValidatorService {
    /** GitHub repository or profile URL (https only). */
    private static readonly GITHUB_REGEX =
        /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+(\/[A-Za-z0-9_.-]+)?(\/)?$/

    /** Google Docs / Sheets / Slides document URL. */
    private static readonly GOOGLE_DOCS_REGEX =
        /^https:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/[A-Za-z0-9_-]+/

    /** Validates one URL is parseable by `URL`. */
    async isParsable(url: string): Promise<void> {
        try {
            new URL(url)
        } catch {
            throw new InvalidUrlException({
                urlString: url,
            })
        }
    }
    /**
     * Validates one URL matches the expected pattern for the challenge submission type.
     */
    isValidForType(
        type: SubmissionType,
        url: string,
    ): boolean {
        const trimmed = url.trim()
        switch (type) {
        case SubmissionType.GithubUrl:
            return UrlValidatorService.GITHUB_REGEX.test(trimmed)
        case SubmissionType.GoogleDocsUrl:
            return UrlValidatorService.GOOGLE_DOCS_REGEX.test(trimmed)
        default:
            return false
        }
    }
    /**
     * Validates one URL is parseable by `URL` and matches the expected pattern for the challenge submission type.
     */
    async isValid(
        {
            submissionId,
            submissionType,
            url,
        }: IsUrlValidParams,
    ): Promise<void> {
        await this.isParsable(url)
        if (
            !this.isValidForType(
                submissionType,
                url
            )
        ) {
            throw new SubmissionUrlInvalidException({
                id: submissionId,
                submissionType,
                url,
            })
        }
    }
}
