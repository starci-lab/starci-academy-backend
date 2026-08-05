/**
 * Optional overrides for {@link GoogleApisModule}. Omit credentials to use ADC
 * (`GOOGLE_APPLICATION_CREDENTIALS`); omit scopes to keep Drive readonly.
 */
export interface GoogleApisModuleOptions {
    /**
     * Scopes used by GoogleAuth.
     *
     * Default:
     * - https://www.googleapis.com/auth/drive.readonly
     */
    scopes?: string[]

    /**
     * Service account JSON content (already parsed).
     * If not provided, GoogleAuth will use ADC (GOOGLE_APPLICATION_CREDENTIALS).
     */
    credentials?: Record<string, unknown>

    /** Optional request timeout for googleapis calls (ms). */
    timeoutMs?: number
}

/**
 * Input for Drive-exporting a Google Doc. Accepts a share/edit URL or raw id so
 * the worker does not have to parse the link itself.
 */
export interface FetchGoogleDocsTextParams {
    /** Google Docs URL (share link or edit link) or raw docId. */
    urlOrId: string
}

/**
 * Exported Doc text plus the resolved id. `docId` is returned so downstream
 * grading can attribute the snapshot even when the caller passed a URL.
 */
export interface FetchGoogleDocsTextResult {
    /** Resolved Google Doc ID. */
    docId: string
    /** Exported plain text content. */
    text: string
}

