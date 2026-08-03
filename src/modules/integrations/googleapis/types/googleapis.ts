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

export interface FetchGoogleDocsTextParams {
    /** Google Docs URL (share link or edit link) or raw docId. */
    urlOrId: string
}

export interface FetchGoogleDocsTextResult {
    /** Resolved Google Doc ID. */
    docId: string
    /** Exported plain text content. */
    text: string
}

