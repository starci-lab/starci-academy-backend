import {
    Controller,
    Post,
    Patch,
    Head,
    Param,
    Req,
    Res,
} from "@nestjs/common"
import {
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger"
import type {
    Request,
    Response,
} from "express"
import {
    MockInvalidUploadRequestException,
} from "@modules/exceptions"
import {
    FileStoreService,
} from "../../file-store"
import {
    readRawBody,
    resolveRequestOrigin,
} from "../../utils"

/** tus protocol version this mock speaks. */
const TUS_VERSION = "1.0.0"

/** Per-PATCH byte cap (the client uses 2 MB chunks). */
const MAX_PATCH_BYTES = 10 * 1024 * 1024

@ApiTags("mock")
@Controller()
/**
 * Mock controller for lesson `3-resumable-upload-tus-protocol`.
 *
 * Implements the tus 1.0.0 core protocol plus the `creation` extension —
 * enough for tus-js-client v4 to create an upload slot (`POST /files`), stream
 * chunks (`PATCH /files/:id` advancing `Upload-Offset`), and resume after a
 * pause (`HEAD /files/:id` reporting the current offset). The bytes live in
 * memory only. Mounted at the bare origin (`new URL(VITE_API_BASE).origin`).
 *
 * Note: the tus response headers (`Location`, `Upload-Offset`, …) are only
 * readable cross-origin because `main.ts` lists them under `exposedHeaders`.
 */
export class TusController {
    constructor(private readonly store: FileStoreService) {}

    /**
     * Creates an upload slot (creation extension). Returns its URL in `Location`.
     */
    @ApiOperation({
        summary: "Create a tus upload (POST /files)",
    })
    @Post("files")
    create(
        @Req() request: Request,
        @Res() response: Response,
    ): void {
        // Upload-Length is mandatory for the creation extension (no deferred length)
        const lengthHeader = request.headers["upload-length"]
        const length = Number(lengthHeader)
        if (typeof lengthHeader !== "string" || !Number.isFinite(length)) {
            throw new MockInvalidUploadRequestException({
                reason: "Missing or invalid Upload-Length header",
            })
        }

        // Upload-Metadata is opaque to us — store and echo it back verbatim
        const metadata = this.headerValue(request.headers["upload-metadata"])
        const id = this.store.createTusUpload(length,
            metadata)

        response.setHeader("Tus-Resumable",
            TUS_VERSION)
        response.setHeader("Location",
            `${resolveRequestOrigin(request)}/files/${id}`)
        response.status(201).end()
    }

    /**
     * Appends a chunk at the client's declared offset and reports the new offset.
     */
    @ApiOperation({
        summary: "Append a tus chunk (PATCH /files/:id)",
    })
    @Patch("files/:id")
    async patch(
        @Param("id") id: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<void> {
        // the client tells us where it believes the upload currently ends
        const offset = Number(request.headers["upload-offset"])
        if (!Number.isFinite(offset)) {
            throw new MockInvalidUploadRequestException({
                reason: "Missing or invalid Upload-Offset header",
            })
        }

        const buffer = await readRawBody(request,
            MAX_PATCH_BYTES)
        const newOffset = this.store.appendTus(id,
            offset,
            buffer)

        response.setHeader("Tus-Resumable",
            TUS_VERSION)
        response.setHeader("Upload-Offset",
            String(newOffset))
        response.status(204).end()
    }

    /**
     * Reports the current offset + total length so the client can resume.
     */
    @ApiOperation({
        summary: "Probe a tus upload (HEAD /files/:id)",
    })
    @Head("files/:id")
    probe(
        @Param("id") id: string,
        @Res() response: Response,
    ): void {
        const upload = this.store.getTusUpload(id)

        response.setHeader("Tus-Resumable",
            TUS_VERSION)
        response.setHeader("Upload-Offset",
            String(upload.buffer.length))
        response.setHeader("Upload-Length",
            String(upload.length))
        // tus requires HEAD responses to be uncacheable
        response.setHeader("Cache-Control",
            "no-store")
        if (upload.metadata) {
            response.setHeader("Upload-Metadata",
                upload.metadata)
        }
        response.status(200).end()
    }

    /** Returns the first value of a possibly-array header. */
    private headerValue(value: string | Array<string> | undefined): string {
        if (Array.isArray(value)) {
            return value[0] ?? ""
        }
        return value ?? ""
    }
}
