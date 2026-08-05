import {
    Inject,
    Injectable,
    Optional,
} from "@nestjs/common"
import {
    google,
} from "googleapis"
import type {
    drive_v3,
} from "googleapis"
import {
    GoogleAuth,
} from "google-auth-library"
import {
    MODULE_OPTIONS_TOKEN,
} from "./googleapis.module-definition"
import type {
    FetchGoogleDocsTextParams,
    FetchGoogleDocsTextResult,
    GoogleApisModuleOptions,
} from "./types"
import {
    getGcpServiceAccountCredentials,
} from "@modules/filesystem"

@Injectable()
/**
 * Google APIs helper focused on fetching Google Docs content via Drive export (text/plain).
 */
export class GoogleDriverAPIService {
    private readonly auth: GoogleAuth
    private readonly drive: drive_v3.Drive

    constructor(
        @Optional()
        @Inject(MODULE_OPTIONS_TOKEN)
        private readonly options?: GoogleApisModuleOptions,
    ) {
        this.auth = new GoogleAuth({
            scopes: this.options?.scopes ?? [
                "https://www.googleapis.com/auth/drive.readonly",
            ],
            credentials: this.options?.credentials
                ?? getGcpServiceAccountCredentials(),
        })

        this.drive = google.drive({
            version: "v3",
            auth: this.auth,
        })
    }

    /** Fetch the text from a Google Docs file. */
    async fetchGoogleDocsText({
        urlOrId,
    }: FetchGoogleDocsTextParams): Promise<FetchGoogleDocsTextResult> {
        /** Extract the Google Doc ID from the URL or ID. */
        const docId = this.extractGoogleDocId(urlOrId)
        /** Timeout. */
        const timeoutMs = this.options?.timeoutMs ?? 30_000

        /** Export the Google Docs file as text/plain. */
        const response = await this.drive.files.export(
            {
                fileId: docId,
                mimeType: "text/plain",
            },
            {
                responseType: "text",
                timeout: timeoutMs,
            },
        )

        /** Return the text. */
        return {
            docId,
            text: typeof response.data === "string" ? response.data : String(response.data),
        }
    }

    /** Extract the Google Doc ID from the URL or ID. */
    private extractGoogleDocId(urlOrId: string): string {
        const trimmed = (urlOrId ?? "").trim()
        if (!trimmed) {
            return ""
        }

        /** If it's already an id (docs ids are typically long-ish and URL-safe). */
        if (!trimmed.includes("/")) {
            return trimmed
        }

        /** Common share/edit URLs. */
        // - https://docs.google.com/document/d/<id>/edit
        // - https://docs.google.com/document/d/<id>/view
        // - https://docs.google.com/document/d/<id>/edit?usp=sharing
        const match = trimmed.match(/docs\.google\.com\/document\/d\/([^/]+)/i)
        if (match?.[1]) {
            return match[1]
        }

        /** Fallback: try to capture any /d/<id> segment. */
        const alt = trimmed.match(/\/d\/([^/]+)/i)
        if (alt?.[1]) {
            return alt[1]
        }

        /** Return an empty string if no ID is found. */
        return ""
    }
}

